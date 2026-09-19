import "./qvac-env.server.ts";
import {
  completion,
  loadModel,
  QWEN3_600M_INST_Q4,
  type CompletionEvent,
  type ModelProgressUpdate,
} from "@qvac/sdk";
import { buildHistory, stripModelChrome } from "./prompts";
import type { CowriteEvent, CowriteRequest } from "./types";

const MODEL_SRC = QWEN3_600M_INST_Q4;
const MODEL_NAME = "Qwen3 0.6B Instruct Q4";
const SDK_VERSION = "0.19.1";

type EngineState =
  | { status: "idle" }
  | { status: "loading"; percentage: number; downloaded: number; total: number }
  | { status: "ready"; modelId: string }
  | { status: "error"; message: string };

let state: EngineState = { status: "idle" };
let loadPromise: Promise<string> | null = null;

export function getEngineSnapshot() {
  return {
    available:
      state.status === "ready" ||
      state.status === "idle" ||
      state.status === "loading",
    backend: "qvac" as const,
    sdk: "@qvac/sdk",
    sdkVersion: SDK_VERSION,
    model: MODEL_NAME,
    state,
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

export async function* runCowrite(
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
