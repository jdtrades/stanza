import { join } from "node:path";
import {
  completion,
  loadModel,
  QWEN3_600M_INST_Q4,
  type CompletionEvent,
  type ModelProgressUpdate,
} from "@qvac/sdk";
import { hasXai, runXaiCowrite } from "./xai.server";
import { buildHistory, stripModelChrome } from "./prompts";
import type { CowriteEvent, CowriteRequest } from "./types";

if (!process.env.QVAC_CONFIG_PATH) {
  process.env.QVAC_CONFIG_PATH = join(process.cwd(), "qvac.config.json");
}

const MODEL_SRC = QWEN3_600M_INST_Q4;
const MODEL_NAME = "Qwen3 0.6B Instruct Q4";

type EngineState =
  | { status: "idle" }
  | { status: "loading"; percentage: number; downloaded: number; total: number }
  | { status: "ready"; modelId: string }
  | { status: "error"; message: string };

let state: EngineState = { status: "idle" };
let loadPromise: Promise<string> | null = null;

function isWorkerFailure(message: string) {
  return /rpc|worker|bare runtime|initialization/i.test(message);
}

export function getEngineSnapshot() {
  const xai = hasXai();
  const qvacReady = state.status === "ready";
  const backend = qvacReady ? "qvac" : xai ? "xai" : state.status === "error" ? "none" : "qvac";
  return {
    available: qvacReady || xai,
    backend,
    sdk: "@qvac/sdk",
    sdkVersion: "0.19.1",
    model: qvacReady ? MODEL_NAME : xai ? "Grok" : MODEL_NAME,
    state,
    xaiAvailable: xai,
    functions: ["loadModel", "completion"] as const,
  };
}

async function ensureModel(
  onProgress: (p: ModelProgressUpdate) => void,
): Promise<string> {
  if (state.status === "ready") return state.modelId;
  if (loadPromise) return loadPromise;

  state = { status: "loading", percentage: 0, downloaded: 0, total: 0 };
  loadPromise = (async () => {
    const modelId = await loadModel({
      modelSrc: MODEL_SRC,
      modelConfig: { ctx_size: 2048 },
      onProgress: (progress) => {
        state = {
          status: "loading",
          percentage: progress.percentage,
          downloaded: progress.downloaded,
          total: progress.total,
        };
        onProgress(progress);
      },
    });
    state = { status: "ready", modelId };
    return modelId;
  })();

  try {
    return await loadPromise;
  } catch (error) {
    loadPromise = null;
    const message =
      error instanceof Error ? error.message : "Failed to load the local model.";
    state = { status: "error", message };
    throw error;
  }
}

async function* runQvacCowrite(
  request: CowriteRequest,
): AsyncGenerator<CowriteEvent> {
  yield { type: "backend", name: "qvac" };
  yield { type: "status", message: "Loading local model" };
  const modelId = await ensureModel((progress) => {
    state = {
      status: "loading",
      percentage: progress.percentage,
      downloaded: progress.downloaded,
      total: progress.total,
    };
  });
  if (state.status === "loading") {
    yield {
      type: "progress",
      percentage: state.percentage,
      downloaded: state.downloaded,
      total: state.total,
    };
  }

  yield { type: "status", message: "Writing on-device" };
  const history = buildHistory(request);
  const run = completion({
    modelId,
    history,
    stream: true,
    captureThinking: true,
    generationParams: { temp: 0.86, predict: 420, reasoning_budget: 0 },
  });

  let assembled = "";
  for await (const event of run.events as AsyncIterable<CompletionEvent>) {
    if (event.type === "contentDelta" && event.text) {
      assembled += event.text;
      yield { type: "token", text: event.text };
    }
  }

  const final = await run.final;
  const text = stripModelChrome(final.contentText || assembled);
  yield { type: "done", text };
}

export async function* runCowrite(
  request: CowriteRequest,
): AsyncGenerator<CowriteEvent> {
  const preferXai = hasXai() && state.status !== "ready";

  if (!preferXai && state.status !== "error") {
    try {
      for await (const event of runQvacCowrite(request)) {
        yield event;
      }
      return;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "On-device generation failed.";
      if (!hasXai() || !isWorkerFailure(message)) {
        yield { type: "error", message };
        return;
      }
    }
  }

  if (hasXai()) {
    yield* runXaiCowrite(request);
    return;
  }

  const message =
    state.status === "error"
      ? state.message
      : "Local model could not start. Run Stanza on your computer to use on-device QVAC.";
  yield { type: "error", message };
}
