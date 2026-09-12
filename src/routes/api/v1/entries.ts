import { createFileRoute } from "@tanstack/react-router";
import { json, requireRestUser, restError } from "@/lib/gold/rest.server";

export const Route = createFileRoute("/api/v1/entries")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const user = await requireRestUser();
          const sort = new URL(request.url).searchParams.get("sort") ?? "newest";
          const { listEntries } = await import("@/lib/gold/entries.server");
          const allowed = ["newest", "oldest", "largest_deposit", "largest_grams"] as const;
          const safe = allowed.includes(sort as (typeof allowed)[number])
            ? (sort as (typeof allowed)[number])
            : "newest";
          return json({ entries: await listEntries(user.id, safe) });
        } catch (err) {
          return restError(err);
        }
      },
      POST: async ({ request }) => {
        try {
          const user = await requireRestUser();
          const body = (await request.json()) as {
            amount: number;
            currency: string;
            depositDate: string;
            note?: string | null;
            idempotencyKey: string;
            manualPrice?: { goldPrice: number; goldPriceUnit: "per_gram" | "per_tola" | "per_troy_ounce"; confirmed: boolean };
          };
          const { createEntry } = await import("@/lib/gold/entries.server");
          return json(await createEntry({ userId: user.id, ...body }), 201);
        } catch (err) {
          return restError(err);
        }
      },
    },
  },
});
