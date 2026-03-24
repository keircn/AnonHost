'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    LuArrowRight,
    LuCircleCheck,
    LuCloudUpload,
    LuCode,
    LuCopy,
    LuExternalLink,
    LuHardDrive,
    LuImage,
    LuLink2,
    LuShield,
    LuSparkles,
    LuTerminal,
    LuUsers,
} from 'react-icons/lu';
import bytes from 'bytes';
import useSWR from 'swr';
import { Stats } from '@/types/stats';

const features = [
    {
        title: 'Image Hosting',
        description:
            'Instant uploads with direct links, automatic previews, and excellent reliability.',
        icon: LuImage,
    },
    {
        title: 'URL Shortener',
        description:
            'Create branded, readable short links with fast redirects and clean analytics.',
        icon: LuLink2,
    },
    {
        title: 'CLI + API',
        description:
            'Automate uploads and link creation from scripts, terminals, and internal tools.',
        icon: LuCode,
    },
    {
        title: 'Privacy First',
        description:
            'European hosting with straightforward policies and practical data protection.',
        icon: LuShield,
    },
];

function formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US').format(Math.max(0, value));
}

export function HomePageClient() {
    const [isCopied, setIsCopied] = useState(false);
    const installCommand = 'curl https://anon.love/install | bash';

    const fetcher = (url: string) => fetch(url).then((r) => r.json());
    const { data: stats, isLoading } = useSWR<Stats>('/api/stats', fetcher, {
        refreshInterval: 300000,
    });

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(installCommand);
            setIsCopied(true);
            toast.success('Install command copied to clipboard');
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text:', err);
            toast.error('Failed to copy install command');
        }
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-background py-8 text-foreground">
            <main className="relative z-10 flex-1 pt-20 sm:pt-24">
                <section className="container mx-auto max-w-7xl px-4 pb-16 md:px-6 md:pb-24">
                    <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-4 py-1.5 text-sm font-medium text-zinc-300">
                                Open source and community funded
                            </div>

                            <h1 className="text-4xl leading-tight font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                                Upload, shorten, and share files in seconds.
                            </h1>

                            <p className="max-w-2xl text-lg leading-relaxed text-zinc-300 sm:text-xl">
                                AnonHost is a fast, practical platform for image hosting and URL
                                shortening with a clean API and terminal-first workflow.
                            </p>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <Button
                                    asChild
                                    size="lg"
                                    className="group bg-zinc-100 text-zinc-900 hover:bg-zinc-300"
                                >
                                    <Link href="/dashboard">
                                        Open Dashboard
                                        <LuArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    size="lg"
                                    variant="outline"
                                    className="border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
                                >
                                    <Link href="/api">
                                        API Docs
                                        <LuExternalLink className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        <div className="relative">
                            <Card className="relative overflow-hidden border-zinc-800 bg-zinc-900/90 shadow-2xl">
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        Dead platform
                                    </CardTitle>
                                    <CardDescription className="text-zinc-400">
                                        Current scale across uploads, users, and total storage.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <StatRow
                                        icon={LuUsers}
                                        label="Registered users"
                                        value={isLoading ? '...' : formatNumber(stats?.users ?? 0)}
                                    />
                                    <StatRow
                                        icon={LuImage}
                                        label="Total uploads"
                                        value={
                                            isLoading ? '...' : formatNumber(stats?.uploads ?? 0)
                                        }
                                    />
                                    <StatRow
                                        icon={LuHardDrive}
                                        label="Storage used"
                                        value={
                                            isLoading
                                                ? '...'
                                                : bytes(Math.max(0, stats?.storage ?? 0), {
                                                    unitSeparator: ' ',
                                                    decimalPlaces: 1,
                                                    fixedDecimals: true,
                                                }) || '0 B'
                                        }
                                    />
                                </CardContent>
                            </Card>

                            <div className="absolute -top-7 -right-4 hidden rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 shadow-lg md:block">
                                Fast uploads. Clean links.
                            </div>
                        </div>
                    </div>
                </section>

                <section className="container mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                        {features.map((feature) => {
                            const Icon = feature.icon;
                            return (
                                <div key={feature.title}>
                                    <Card className="h-full border-zinc-800 bg-zinc-900/85 shadow-md transition-colors hover:bg-zinc-900">
                                        <CardHeader className="pb-3">
                                            <div className="mb-2 w-fit rounded-lg bg-zinc-800 p-2 text-zinc-300">
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <CardTitle className="text-xl">{feature.title}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm leading-relaxed text-zinc-400">
                                                {feature.description}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="container mx-auto max-w-7xl px-4 py-14 md:px-6">
                    <Card className="overflow-hidden border-zinc-800 bg-zinc-900/85 shadow-xl">
                        <CardHeader className="border-b border-zinc-800 bg-zinc-900">
                            <CardTitle className="flex items-center gap-2 text-2xl">
                                <LuTerminal className="h-6 w-6 text-zinc-300" />
                                CLI in one command
                            </CardTitle>
                            <CardDescription className="text-zinc-400">
                                Install AnonHost CLI and start uploading from your terminal.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-5 p-6">
                            <div className="flex flex-col items-stretch gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-3 sm:flex-row sm:items-center sm:gap-3">
                                <code className="flex-1 font-mono text-sm text-zinc-200 sm:text-base">
                                    {installCommand}
                                </code>
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    onClick={handleCopy}
                                    aria-label="Copy install command"
                                    className="shrink-0"
                                >
                                    {isCopied ? (
                                        <LuCircleCheck className="h-4 w-4 text-zinc-900" />
                                    ) : (
                                        <LuCopy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>

                            <p className="text-sm text-zinc-400">
                                Requires `curl` + `bash`, installs `anonhost` into
                                `~/.local/bin`, and verifies dependencies automatically.
                            </p>
                        </CardContent>
                    </Card>
                </section>

                <section className="container mx-auto max-w-7xl px-4 pb-16 md:px-6 md:pb-24">
                    <Card className="relative overflow-hidden border-zinc-800 bg-zinc-900 shadow-2xl">
                        <div className="absolute -right-16 -bottom-14 h-56 w-56 rounded-full bg-zinc-800/70 blur-3xl" />
                        <CardContent className="relative flex flex-col items-start gap-6 p-7 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
                            <div className="max-w-2xl space-y-3">
                                <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                                    Ready to ship your first link?
                                </h2>
                                <p className="text-base text-zinc-400">
                                    Create an account in under a minute and start uploading,
                                    shortening, and sharing right away.
                                </p>
                            </div>

                            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                                <Button
                                    asChild
                                    size="lg"
                                    className="bg-zinc-100 text-zinc-900 hover:bg-zinc-300"
                                >
                                    <Link href="/register">
                                        Create Free Account
                                        <LuArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    size="lg"
                                    variant="outline"
                                    className="border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
                                >
                                    <Link href="/pricing">View Pricing</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </section>
            </main>
        </div>
    );
}

function StatRow({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof LuUsers;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3">
            <div className="flex items-center gap-3">
                <span className="rounded-md bg-zinc-800 p-2 text-zinc-300">
                    <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm text-zinc-400">{label}</span>
            </div>
            <span className="text-lg font-semibold text-white">{value}</span>
        </div>
    );
}
