import { createFileRoute } from "@tanstack/react-router";
import type { CowriteRequest } from "@/lib/qvac/types";

export const Route = createFileRoute("/api/cowrite")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: CowriteRequest;
        try {
          body = (await request.json()) as CowriteRequest;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        if (!body?.action || !body.song) {
          return new Response("Missing action or song", { status: 400 });
        }

        const { runCowrite } = await import("@/lib/qvac/engine.server");

        const stream = new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder();
            const send = (data: unknown) => {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
              );
            };
            try {
              for await (const event of runCowrite(body)) {
                send(event);
              }
            } catch (error) {
              send({
                type: "error",
                message:
                  error instanceof Error
                    ? error.message
                    : "On-device generation failed.",
              });
            } finally {
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "content-type": "text/event-stream; charset=utf-8",
            "cache-control": "no-cache, no-transform",
            connection: "keep-alive",
          },
        });
      },
    },
  },
});
