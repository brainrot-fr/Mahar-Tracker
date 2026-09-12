import { createFileRoute } from "@tanstack/react-router";
import { json, requireRestUser, restError } from "@/lib/gold/rest.server";

export const Route = createFileRoute("/api/v1/export")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const user = await requireRestUser();
          const { exportUserData } = await import("@/lib/gold/entries.server");
          return json(await exportUserData(user.id));
        } catch (err) {
          return restError(err);
        }
      },
    },
  },
});
