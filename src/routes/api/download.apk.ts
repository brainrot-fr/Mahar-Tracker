import { createFileRoute } from "@tanstack/react-router";

const repository = "brainrot-fr/Mahar-Tracker";
const apkName = "app-release.apk";

export const Route = createFileRoute("/api/download/apk")({
  server: {
    handlers: {
      GET: async () => {
        const response = await fetch(
          `https://api.github.com/repos/${repository}/releases?per_page=20`,
          {
            headers: {
              Accept: "application/vnd.github+json",
              "User-Agent": "Mahar-Tracker-APK-Download",
            },
          },
        );

        if (!response.ok) {
          return new Response("Unable to find the latest Android release.", {
            status: 502,
            headers: { "Cache-Control": "no-store" },
          });
        }

        const releases = (await response.json()) as Array<{
          draft: boolean;
          prerelease: boolean;
          assets: Array<{ name: string; browser_download_url: string }>;
        }>;
        const asset = releases
          .filter((release) => !release.draft && !release.prerelease)
          .flatMap((release) => release.assets)
          .find((candidate) => candidate.name === apkName);

        if (!asset) {
          return new Response("The Android APK has not been published yet.", {
            status: 404,
            headers: { "Cache-Control": "no-store" },
          });
        }

        return Response.redirect(asset.browser_download_url, 302);
      },
    },
  },
});
