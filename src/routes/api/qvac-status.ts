import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/qvac-status")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { getEngineSnapshot } = await import(
            "@/lib/qvac/engine.server"
          );
          return Response.json(getEngineSnapshot());
        } catch (error) {
          return Response.json(
            {
              available: false,
              backend: "none",
              sdk: "@qvac/sdk",
              sdkVersion: "0.19.1",
              model: "Qwen3 0.6B Instruct Q4",
              state: {
                status: "error",
                message:
                  error instanceof Error
                    ? error.message
                    : "QVAC could not start in this environment.",
              },
              functions: ["loadModel", "completion"],
            },
            { status: 200 },
          );
        }
      },
    },
  },
});
