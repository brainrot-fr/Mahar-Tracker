import { createFileRoute } from "@tanstack/react-router";
import { json, requireRestUser, restError } from "@/lib/gold/rest.server";

export const Route = createFileRoute("/api/v1/dashboard")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const user = await requireRestUser();
          const { loadDashboard } = await import("@/lib/gold/dashboard.server");
          return json(await loadDashboard(user.id));
        } catch (err) {
          return restError(err);
        }
      },
    },
  },
});
