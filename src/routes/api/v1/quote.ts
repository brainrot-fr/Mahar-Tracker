import { createFileRoute } from "@tanstack/react-router";
import { json, requireRestUser, restError } from "@/lib/gold/rest.server";

export const Route = createFileRoute("/api/v1/quote")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const user = await requireRestUser();
          const body = (await request.json()) as { date?: string; currency?: string };
          const { ensureProfile } = await import("@/lib/gold/entries.server");
          const { quoteGoldPrice } = await import("@/lib/gold/quote.server");
          const profile = await ensureProfile(user.id);
          return json(
            await quoteGoldPrice({
              date: String(body.date),
              currency: String(body.currency ?? profile.preferredCurrency),
              preferredProvider: profile.selectedProvider,
            }),
          );
        } catch (err) {
          return restError(err);
        }
      },
    },
  },
});
