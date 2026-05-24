"use client";

import { useState } from "react";
import { toast } from "sonner";
import bytes from "bytes";
import useSWR from "swr";
import { Stats } from "@/types/stats";

const installCommand = "curl https://anonhost.cc/install | bash";
const curlExamples = [
  { label: "Upload a screenshot via curl", cmd: 'curl -F "file=@screenshot.png" https://anonhost.cc/api/upload' },
  { label: "Shorten a URL", cmd: "curl -X POST https://anonhost.cc/api/shortener -H \"Content-Type: application/json\" -d '{\"url\":\"https://example.com/long-url\"}'" },
];

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(Math.max(0, value));
}

export function HomePageClient() {
  const [isCopied, setIsCopied] = useState(false);
  const fetcher = (url: string) => fetch(url).then((r) => r.json());
  const { data: stats, isLoading } = useSWR<Stats>("/api/stats", fetcher, {
    refreshInterval: 300000,
  });

  const storage = isLoading
    ? "..."
    : bytes(Math.max(0, stats?.storage ?? 0), {
        unitSeparator: " ",
        decimalPlaces: 1,
        fixedDecimals: true,
      }) || "0 B";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(installCommand);
      setIsCopied(true);
      toast.success("Install command copied");
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error("Failed to copy install command");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-12 py-12 sm:py-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          AnonHost
        </h1>
        <p className="mt-2 text-muted-foreground">
          File hosting. Short links. API access. No ads, no bullshit.
        </p>
      </div>

      <div className="grid grid-cols-3 divide-x rounded-md border text-sm">
        <div className="px-4 py-3">
          <div className="font-mono text-lg font-bold tabular-nums">
            {isLoading ? ".." : formatNumber(stats?.users ?? 0)}
          </div>
          <div className="text-xs text-muted-foreground">users</div>
        </div>
        <div className="px-4 py-3">
          <div className="font-mono text-lg font-bold tabular-nums">
            {isLoading ? ".." : formatNumber(stats?.uploads ?? 0)}
          </div>
          <div className="text-xs text-muted-foreground">files</div>
        </div>
        <div className="px-4 py-3">
          <div className="font-mono text-lg font-bold tabular-nums">{storage}</div>
          <div className="text-xs text-muted-foreground">stored</div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="font-semibold">What this is</h2>
          <div className="mt-2 space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              A place to dump files and share them. Upload an image, get a URL.
              Works with ShareX, curl, or the web interface.
            </p>
            <p>
              URLs can be shortlinks with titles and click tracking. Everything
              has an API key if you want to wire it into something.
            </p>
          </div>
        </div>

        <div>
          <h2 className="font-semibold">CLI</h2>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-md border bg-muted px-3 py-2 font-mono text-sm whitespace-nowrap">
              {installCommand}
            </code>
            <button
              onClick={handleCopy}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground hover:text-foreground transition-colors"
              title="Copy"
            >
              {isCopied ? (
                <svg className="size-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              ) : (
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>
              )}
            </button>
          </div>
        </div>

        <div>
          <h2 className="font-semibold">Quick examples</h2>
          <div className="mt-2 space-y-3 text-sm">
            {curlExamples.map((ex) => (
              <div key={ex.label} className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground mb-1">{ex.label}</div>
                <code className="block font-mono text-xs">{ex.cmd}</code>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t pt-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>&copy; {new Date().getFullYear()} AnonHost</span>
          <a href="/terms" className="hover:text-foreground transition-colors">Terms</a>
          <a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a>
          <a href="https://ko-fi.com/qkeiran" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Support</a>
          <a href="https://github.com/keiranst/anonhost" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
        </div>
      </div>
    </div>
  );
}
