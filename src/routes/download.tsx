import { createFileRoute } from "@tanstack/react-router";
import { Download, Smartphone } from "lucide-react";
import { AppShell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/download")({ component: DownloadPage });

const apkUrl = "/api/download/apk";

function DownloadPage() {
  return (
    <AppShell>
      <div className="flex items-center gap-3 text-metal">
        <Smartphone className="size-6" aria-hidden="true" />
        <p className="text-xs uppercase tracking-wider">Android app</p>
      </div>
      <h1 className="mt-2 font-display text-3xl text-fg">
        Take Ukhiya with you
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Install the Android app to keep recording mahar savings from your phone.
        Your records stay connected when you sign in with the same account.
      </p>

      <Card className="mt-6 space-y-4">
        <>
          <p className="text-sm text-fg">
            The latest Android package is ready.
          </p>
          <Button asChild className="w-full">
            <a href={apkUrl}>
              <Download className="size-4" aria-hidden="true" />
              Download APK
            </a>
          </Button>
          <p className="text-xs leading-relaxed text-subtle">
            Android may ask you to allow installation from this source. Only
            install packages published by the app owner.
          </p>
        </>
      </Card>
    </AppShell>
  );
}
