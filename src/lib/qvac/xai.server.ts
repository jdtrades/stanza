import { env } from "@/lib/env.server";
import { buildHistory, stripModelChrome } from "./prompts";
import type { CowriteEvent, CowriteRequest } from "./types";

const MODEL = "grok-4.5";
const MAX_TOKENS = 700;

export function hasXai(): boolean {
  return Boolean(env("XAI_API_KEY"));
}

export async function* runXaiCowrite(
  request: CowriteRequest,
): AsyncGenerator<CowriteEvent> {
  const apiKey = env("XAI_API_KEY");
  if (!apiKey) {
    yield { type: "error", message: "Co-writer is not available in this environment." };
    return;
  }

  yield { type: "backend", name: "xai" };
  yield { type: "status", message: "Writing with Grok" };

  const history = buildHistory(request);
  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      temperature: 0.9,
      max_tokens: MAX_TOKENS,
      messages: history,
    }),
  });

  if (!response.ok || !response.body) {
    yield {
      type: "error",
      message: `Grok could not write right now (${response.status}). Try again.`,
    };
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let assembled = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const json = JSON.parse(payload) as {
          choices?: { delta?: { content?: string } }[];
        };
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) {
          assembled += delta;
          yield { type: "token", text: delta };
        }
      } catch {
        // ignore malformed SSE chunks
      }
    }
  }

  const text = stripModelChrome(assembled);
  if (!text) {
    yield { type: "error", message: "Grok returned an empty take. Try again." };
    return;
  }
  yield { type: "done", text };
}
