import { createFileRoute } from "@tanstack/react-router";
import { APP_NAME } from "@/lib/gold/constants";

export const Route = createFileRoute("/api/v1/health")({
  server: {
    handlers: {
      GET: () =>
        Response.json({
          ok: true,
          name: APP_NAME,
          version: 1,
          contract: {
            dashboard: "GET /api/v1/dashboard",
            entries: "GET|POST /api/v1/entries",
            entry: "GET|PATCH|DELETE /api/v1/entries/:id",
            quote: "POST /api/v1/quote",
            me: "GET /api/v1/me",
            export: "GET /api/v1/export",
          },
        }),
    },
  },
});
