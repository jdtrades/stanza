import type { CowriteEvent, CowriteRequest } from "@/lib/qvac/types";

export async function cowriteStream(
  request: CowriteRequest,
  onEvent: (event: CowriteEvent) => void,
  signal?: AbortSignal,
) {
  const response = await fetch("/api/cowrite", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok || !response.body) {
    const message = await response.text().catch(() => "Co-writer request failed.");
    onEvent({ type: "error", message });
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

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
      if (!payload) continue;
      try {
        onEvent(JSON.parse(payload) as CowriteEvent);
      } catch {
        // ignore malformed chunks
      }
    }
  }
}

export interface QvacStatus {
  available: boolean;
  backend: "qvac" | "xai" | "none";
  sdk: string;
  sdkVersion: string;
  model: string;
  state:
    | { status: "idle" }
    | { status: "loading"; percentage: number; downloaded: number; total: number }
    | { status: "ready"; modelId: string }
    | { status: "error"; message: string };
  xaiAvailable: boolean;
  functions: string[];
  error?: string;
}

export async function fetchQvacStatus(): Promise<QvacStatus> {
  const response = await fetch("/api/qvac-status");
  if (!response.ok) {
    return {
      available: false,
      backend: "none",
      sdk: "@qvac/sdk",
      sdkVersion: "0.19.1",
      model: "Qwen3 0.6B Instruct Q4",
      state: { status: "error", message: "Status endpoint unavailable." },
      xaiAvailable: false,
      functions: ["loadModel", "completion"],
    };
  }
  return (await response.json()) as QvacStatus;
}
