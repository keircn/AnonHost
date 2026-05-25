"use client";

import { useState } from "react";
import { toast } from "sonner";

const installCommand = "curl https://anonhost.cc/install | bash";

export function HomePageClient() {
  const [isCopied, setIsCopied] = useState(false);

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
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8 py-12 sm:py-20">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          AnonHost
        </h1>
        <p className="mt-2 text-muted-foreground">
          File hosting. Short links. API access. No ads, no bullshit.
        </p>
      </div>

      <img src="/haruhi-suzumiya-plotting.gif" alt="" className="w-72" />

      <div className="w-full space-y-4">
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
      </div>

      <div className="w-full border-t pt-8">
        <h2 className="font-semibold">CLI</h2>
        <div className="mt-2 flex items-center gap-2">
          <code className="flex-1 rounded-md border bg-muted px-3 py-2 font-mono text-sm whitespace-nowrap">
            {installCommand}
          </code>
          <button
            onClick={handleCopy}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground hover:text-foreground transition-colors"
            title="Copy install command"
          >
            {isCopied ? (
              <svg className="size-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
            ) : (
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
