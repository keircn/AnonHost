"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Badge as RetroBadge,
  Button as RetroButton,
  Card as RetroCard,
  ProgressBar,
} from "retro-react";
import {
  LuArchive,
  LuCircleCheck,
  LuCopy,
  LuFile,
  LuHardDrive,
  LuImage,
  LuKeyRound,
  LuLink2,
  LuLock,
  LuMusic,
  LuSettings,
  LuShieldCheck,
  LuTerminal,
  LuUpload,
  LuUsers,
  LuVideo,
} from "react-icons/lu";
import bytes from "bytes";
import useSWR from "swr";
import { Stats } from "@/types/stats";

const installCommand = "curl https://anonhost.cc/install | bash";

const desktopShortcuts = [
  { label: "Upload", hint: "drop files", icon: LuUpload, href: "/upload" },
  { label: "Shorten", hint: "clean URLs", icon: LuLink2, href: "/shortener" },
  { label: "Keys", hint: "API access", icon: LuKeyRound, href: "/settings" },
  { label: "Settings", hint: "privacy", icon: LuSettings, href: "/settings" },
];

const transferRows = [
  { name: "screenshot-0426.png", type: "image/png", progress: 100, status: "ready" },
  { name: "demo-recording.mp4", type: "video/mp4", progress: 73, status: "uploading" },
  { name: "release-build.zip", type: "application/zip", progress: 42, status: "queued" },
];

const fileTypes = [
  { label: "PNG", icon: LuImage },
  { label: "MP4", icon: LuVideo },
  { label: "MP3", icon: LuMusic },
  { label: "ZIP", icon: LuArchive },
  { label: "TXT", icon: LuFile },
];

const privacyItems = [
  "Private files by default",
  "Embed controls per upload",
  "Metadata stripping options",
  "Custom domain routing",
];

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(Math.max(0, value));
}

export function HomePageClient() {
  const [isCopied, setIsCopied] = useState(false);
  const router = useRouter();
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
    } catch (err) {
      console.error("Failed to copy text:", err);
      toast.error("Failed to copy install command");
    }
  };

  return (
    <main className="w-full overflow-hidden">
      <section className="container mx-auto max-w-7xl px-4 py-10 md:px-6 lg:py-14">
        <RetroCard sx={windowSx}>
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
            <div className="space-y-4">
              <div className="retro-inset p-5 sm:p-6">
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div>
                    <h1 className="max-w-4xl text-4xl font-black leading-[0.95] sm:text-6xl">
                      A public drawer for files, links, and quick uploads.
                    </h1>
                  </div>
                </div>
                <p className="max-w-3xl text-base leading-7 text-muted-foreground">
                  AnonHost gives you a small, direct place to put files, create short links, and
                  wire uploads into ShareX, scripts, or the CLI.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {desktopShortcuts.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => router.push(item.href)}
                        className="retro-outset flex min-h-24 flex-col items-start justify-between p-3 text-left transition-transform active:translate-x-1 active:translate-y-1"
                      >
                        <Icon className="h-7 w-7" />
                        <span>
                          <span className="block text-sm font-bold">{item.label}</span>
                          <span className="text-muted-foreground block text-xs">{item.hint}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="retro-outset p-3">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-bold">Transfer queue</span>
                  <span className="font-mono text-xs text-muted-foreground">3 JOBS</span>
                </div>
                <div className="space-y-2">
                  {transferRows.map((row) => (
                    <TransferRow key={row.name} {...row} />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div className="retro-outset p-3">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-bold">Instance counters</span>
                  <LuHardDrive className="h-4 w-4" />
                </div>
                <div className="grid gap-2">
                  <CounterLine
                    icon={LuUsers}
                    label="Users"
                    value={isLoading ? "..." : formatNumber(stats?.users ?? 0)}
                  />
                  <CounterLine
                    icon={LuImage}
                    label="Uploads"
                    value={isLoading ? "..." : formatNumber(stats?.uploads ?? 0)}
                  />
                  <CounterLine icon={LuHardDrive} label="Storage" value={storage} />
                </div>
              </div>

              <div className="retro-inset p-3">
                <div className="mb-3 flex items-center gap-2">
                  <LuTerminal className="h-4 w-4" />
                  <span className="font-bold">Install CLI</span>
                </div>
                <code className="retro-inset block overflow-x-auto whitespace-nowrap p-2 font-mono text-xs">
                  {installCommand}
                </code>
                <RetroButton
                  className="mt-3 w-full"
                  variant="secondary"
                  size="small"
                  onClick={handleCopy}
                >
                  {isCopied ? "Copied" : "Copy command"}
                </RetroButton>
              </div>
            </div>
          </div>
        </RetroCard>
      </section>

      <section className="py-8">
        <div className="container mx-auto grid max-w-7xl w-full gap-4 px-2 md:grid-cols-[1.1fr_0.9fr] md:px-6">
          <RetroCard header={<WindowTitle title="SUPPORTED FILE TYPES" />} sx={windowSx}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {fileTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <div key={type.label} className="retro-inset p-4 text-center">
                    <Icon className="mx-auto mb-3 h-7 w-7" />
                    <span className="font-mono text-xs">{type.label}</span>
                  </div>
                );
              })}
            </div>
          </RetroCard>

          <RetroCard header={<WindowTitle title="UPLOAD DEFAULTS" />} sx={windowSx}>
            <div className="grid gap-2 sm:grid-cols-2">
              {privacyItems.map((item) => (
                <div key={item} className="retro-inset flex items-center gap-2 p-3 text-sm">
                  <LuShieldCheck className="h-4 w-4 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </RetroCard>
        </div>
      </section>

      <section className="container mx-auto grid max-w-7xl gap-4 px-4 py-8 md:grid-cols-3 md:px-6">
        <SystemPanel
          title="ShareX ready"
          command="POST /api/upload"
          body="Create API keys and point ShareX at AnonHost for fast screen captures."
        />
        <SystemPanel
          title="Short links"
          command="POST /api/shortener"
          body="Make readable links with titles, expiry options, and click counts."
        />
        <SystemPanel
          title="Direct storage"
          command="PUT R2 OBJECT"
          body="Large files use direct upload paths so the app stays responsive."
        />
      </section>

      <section className="container mx-auto grid max-w-7xl gap-5 px-4 pb-12 md:px-6 lg:grid-cols-[0.95fr_1.05fr]">
        <RetroCard header={<WindowTitle title="ACCOUNT SLOTS" />} sx={windowSx}>
          <div className="grid gap-3 sm:grid-cols-2">
            <AccountSlot
              name="Free"
              price="$0"
              body="Dashboard uploads, URL shortener, API access, and private files."
              action="Create account"
              onClick={() => router.push("/register")}
            />
            <AccountSlot
              name="Premium"
              price="More room"
              body="Larger files, unlimited storage, custom domains, and priority support."
              action="View limits"
              onClick={() => router.push("/pricing")}
            />
          </div>
        </RetroCard>

        <RetroCard header={<WindowTitle title="WHY IT EXISTS" />} sx={windowSx}>
          <div className="retro-inset p-4">
            <p className="text-lg font-bold">A file host should feel like a tool, not a funnel.</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              The dashboard is for files, links, domains, keys, and upload settings. The landing
              page now shows the same mental model: a small control panel for moving things onto the
              web.
            </p>
          </div>
        </RetroCard>
      </section>
    </main>
  );
}

const windowSx = {
  background: "#d8d8d8",
  color: "#000000",
  borderColor: "#fff #555 #555 #fff",
  boxShadow: "8px 8px 0 #808080",
};

function WindowTitle({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="truncate">{title}</span>
      {right && <span className="flex shrink-0 items-center gap-2">{right}</span>}
    </div>
  );
}

function TransferRow({
  name,
  type,
  progress,
  status,
}: {
  name: string;
  type: string;
  progress: number;
  status: string;
}) {
  return (
    <div className="retro-inset grid gap-2 p-3">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="truncate font-bold">{name}</span>
        <span className="font-mono text-xs uppercase text-muted-foreground">{status}</span>
      </div>
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{type}</span>
        <span>{progress}%</span>
      </div>
      <ProgressBar value={progress} animated={progress < 100} />
    </div>
  );
}

function CounterLine({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof LuUsers;
  label: string;
  value: string;
}) {
  return (
    <div className="retro-inset flex items-center justify-between gap-3 p-2">
      <span className="flex min-w-0 items-center gap-2 text-sm">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{label}</span>
      </span>
      <span className="font-mono text-sm font-bold">{value}</span>
    </div>
  );
}

function SystemPanel({ title, command, body }: { title: string; command: string; body: string }) {
  return (
    <div className="surface-panel p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-bold">{title}</h2>
        <LuCircleCheck className="h-4 w-4" />
      </div>
      <code className="retro-inset mb-3 block p-2 font-mono text-xs">{command}</code>
      <p className="text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}

function AccountSlot({
  name,
  price,
  body,
  action,
  onClick,
}: {
  name: string;
  price: string;
  body: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div className="retro-inset p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold">{name}</h3>
          <p className="text-muted-foreground text-xs">ACCOUNT SLOT</p>
        </div>
        <span className="font-mono text-sm font-bold">{price}</span>
      </div>
      <p className="min-h-16 text-sm leading-6 text-muted-foreground">{body}</p>
      <RetroButton className="mt-4 w-full" variant="secondary" onClick={onClick}>
        {action}
      </RetroButton>
    </div>
  );
}
