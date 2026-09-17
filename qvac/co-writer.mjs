#!/usr/bin/env node
/**
 * Stanza co-writer — local lyric generation via Tether QVAC.
 *
 * This script is the CLI path of the same on-device pipeline the web app uses.
 * It calls loadModel() and completion() from @qvac/sdk. Nothing is sent to a
 * cloud model provider.
 *
 * Usage:
 *   echo '{"action":"draft","song":{"title":"Wire Fence","genre":"folk","mood":"dusk","key":"G","bpm":84,"notes":"","sections":[]},"focusSectionIndex":0,"instruction":"leaving town at dusk"}' \
 *     | node qvac/co-writer.mjs
 */
import { completion, loadModel, QWEN3_600M_INST_Q4 } from "@qvac/sdk";

const SYSTEM =
  "You are a working songwriter at a private desk. Write lyrics only. No commentary, no markdown, no quotation marks around the song. Do not mention AI. Keep lines singable: concrete images, short lines, natural speech-rhythm.";

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) {
    return {
      action: "draft",
      song: {
        title: "Untitled",
        genre: "folk",
        mood: "dusk",
        key: "G",
        bpm: 84,
        notes: "",
        sections: [],
      },
      focusSectionIndex: 0,
      instruction: "a short folk song about a county road at dusk",
    };
  }
  return JSON.parse(raw);
}

function emit(event) {
  process.stdout.write(`${JSON.stringify(event)}\n`);
}

const request = await readStdin();
const instruction = request.instruction
  ? `\nDirection: ${request.instruction}`
  : "";
const history = [
  { role: "system", content: SYSTEM },
  {
    role: "user",
    content: `Write lyrics for a ${request.song?.mood ?? "dusk"} ${request.song?.genre ?? "folk"} song titled "${request.song?.title ?? "Untitled"}". Action: ${request.action}.${instruction}\nOutput lyrics only.`,
  },
];

try {
  emit({ type: "status", message: "Loading local model" });
  const modelId = await loadModel({
    modelSrc: QWEN3_600M_INST_Q4,
    modelConfig: { ctx_size: 2048 },
    onProgress: (progress) => {
      emit({
        type: "progress",
        percentage: progress.percentage,
        downloaded: progress.downloaded,
        total: progress.total,
      });
    },
  });

  emit({ type: "status", message: "Writing on-device" });
  const result = completion({
    modelId,
    history,
    stream: true,
    captureThinking: true,
    generationParams: { temp: 0.86, predict: 420, reasoning_budget: 0 },
  });

  let assembled = "";
  for await (const event of result.events) {
    if (event.type === "contentDelta" && event.text) {
      assembled += event.text;
      emit({ type: "token", text: event.text });
    }
  }
  const final = await result.final;
  emit({ type: "done", text: (final.contentText || assembled).trim() });
} catch (error) {
  emit({
    type: "error",
    message: error instanceof Error ? error.message : String(error),
  });
  process.exitCode = 1;
}
