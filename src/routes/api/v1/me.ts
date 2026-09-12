import { createFileRoute } from "@tanstack/react-router";
import { json, requireRestUser, restError } from "@/lib/gold/rest.server";

export const Route = createFileRoute("/api/v1/me")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const user = await requireRestUser();
          const { ensureProfile, getActiveGoal } = await import("@/lib/gold/entries.server");
          const [profile, goal] = await Promise.all([
            ensureProfile(user.id),
            getActiveGoal(user.id),
          ]);
          return json({ user, profile, goal });
        } catch (err) {
          return restError(err);
        }
      },
    },
  },
});
