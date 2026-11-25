
"use client";

import { useState } from "react";
import Link from "next/link";

type PluginsClientProps = {
    user: {
        id: string;
        email: string;
    };
};

export default function PluginsClient({ user }: PluginsClientProps) {
    const [notice, setNotice] = useState("");

    return (
        <main className="min-h-screen bg-[#100e10] text-[#f6f1f2]">
            {/* Top navigation */}
            <header className="border-b border-white/10 bg-[#151215]">
                <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 md:px-8">
                    <Link href="/diagnose" className="text-xl font-semibold tracking-tight">
                        Embedded<span className="text-[#efa4a5]">Sense</span>
                    </Link>

                    <Link
                        href="/diagnose"
                        className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-white/60 transition hover:border-[#efa4a5]/30 hover:text-[#efa4a5]"
                    >
                        <span aria-hidden="true">←</span>
                        Back to workspace
                    </Link>
                </div>
            </header>

            {/* Plugins directory */}
            <section className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
                <div className="mb-10 max-w-2xl">
                    <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#efa4a5]">
                        EmbeddedSense / Extensions
                    </p>

                    <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                        Plugins
                    </h1>

                    <p className="mt-3 text-sm leading-7 text-white/45">
                        Extend EmbeddedSense with external integrations. Connect the tools
                        you use to bring more context into your engineering workflow.
                    </p>
                </div>

                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-white/85">
                            Available integrations
                        </h2>
                        <p className="mt-1 text-xs text-white/35">
                            Connect an account to make its capabilities available to your workspace.
                        </p>
                    </div>

                    <span className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] uppercase tracking-wider text-white/40">
                        1 plugin
                    </span>
                </div>

                {/* GitHub plugin card */}
                <article className="max-w-2xl rounded-2xl border border-white/10 bg-[#151215] p-5 transition hover:border-[#efa4a5]/25 md:p-7">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-[#211e22]">
                                <svg
                                    viewBox="0 0 24 24"
                                    className="h-7 w-7 fill-white"
                                    role="img"
                                    aria-label="GitHub"
                                >
                                    <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.56.1.76-.24.76-.54v-2.08c-3.1.67-3.76-1.32-3.76-1.32-.5-1.28-1.24-1.62-1.24-1.62-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15.99 1.7 2.6 1.21 3.23.92.1-.72.39-1.21.7-1.49-2.47-.28-5.07-1.24-5.07-5.5 0-1.22.44-2.22 1.15-3-.12-.28-.5-1.42.11-2.96 0 0 .94-.3 3.05 1.15a10.6 10.6 0 0 1 5.55 0c2.11-1.45 3.05-1.15 3.05-1.15.61 1.54.23 2.68.11 2.96.72.78 1.15 1.78 1.15 3 0 4.27-2.61 5.22-5.09 5.49.4.35.75 1.02.75 2.06v3.07c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z" />
                                </svg>
                            </div>

                            <div>
                                <h3 className="text-base font-semibold text-white">
                                    GitHub
                                </h3>
                                <p className="mt-1 text-xs text-white/40">
                                    Code hosting and collaboration
                                </p>
                            </div>
                        </div>

                        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-1.5 text-[10px] font-medium tracking-wide text-emerald-300">
                            AVAILABLE
                        </span>
                    </div>

                    <p className="mt-6 max-w-xl text-sm leading-7 text-white/50">
                        Connect your GitHub account to let EmbeddedSense work with your
                        repositories, source files, issues, and pull requests through the
                        GitHub MCP integration.
                    </p>

                    <div className="mt-6 grid gap-3 border-y border-white/[0.07] py-5 sm:grid-cols-2">
                        {[
                            "Browse repositories and files",
                            "Search source code",
                            "Review issues and pull requests",
                            "Read repository documentation",
                        ].map((item) => (
                            <div
                                key={item}
                                className="flex items-center gap-2.5 text-xs text-white/55"
                            >
                                <span className="text-[#efa4a5]" aria-hidden="true">
                                    ✓
                                </span>
                                {item}
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-[11px] leading-5 text-white/30">
                            You control the account authorization and can disconnect it later.
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                setNotice(
                                    "GitHub authorization will be enabled after the FastAPI OAuth and MCP endpoints are implemented."
                                )
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#efa4a5] px-5 py-3 text-sm font-semibold text-[#100e10] transition hover:bg-[#f5b7b7]"
                        >
                            Connect GitHub
                            <span aria-hidden="true">→</span>
                        </button>
                    </div>

                    {notice && (
                        <div
                            role="status"
                            className="mt-4 rounded-xl border border-[#efa4a5]/20 bg-[#efa4a5]/[0.07] px-4 py-3 text-xs leading-6 text-[#f0babb]"
                        >
                            {notice}
                        </div>
                    )}
                </article>

                <p className="mt-10 text-[10px] leading-5 text-white/25">
                    More integrations will appear here as they become available.
                </p>
            </section>
        </main>
    );
}
