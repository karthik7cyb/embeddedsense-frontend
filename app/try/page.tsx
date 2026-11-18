
"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
    role: "user" | "assistant";
    content: string;
};

const EXAMPLES = [
    "ESP32 keeps restarting when a motor starts",
    "STM32 board is not detected over USB",
    "Voltage regulator is overheating",
];

export default function TryPage() {
    const [prompt, setPrompt] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [streamStatus, setStreamStatus] = useState("");
    const [selectedRoute, setSelectedRoute] = useState<"rag" | "tool" | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Automatically scroll to the latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end",
        });
    }, [messages]);

    // Submit hardware diagnosis request
    async function handleSubmit() {
        const question = prompt.trim();

        if (!question || loading) return;

        setPrompt("");
        setError("");
        setLoading(true);
        setStreamStatus("");
        setSelectedRoute(null);

        setMessages((previous) => [
            ...previous,
            { role: "user", content: question },
            { role: "assistant", content: "" },
        ]);

        try {
            const apiUrl =
                process.env.NEXT_PUBLIC_API_URL ||
                "http://127.0.0.1:8000";

            const response = await fetch(`${apiUrl}/llm`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ prompt: question }),
            });

            if (!response.ok) {
                throw new Error(`Backend error: ${response.status}`);
            }

            if (!response.body) {
                throw new Error("No response stream received.");
            }

            // Read and process Server-Sent Events
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            let fullResponse = "";
            let buffer = "";
            let receivedDone = false;

            function processSSEFrame(frame: string) {
                let event = "message";
                const dataLines: string[] = [];

                for (const line of frame.split("\n")) {
                    if (line.startsWith(":")) continue;

                    const separator = line.indexOf(":");
                    if (separator === -1) continue;

                    const field = line.slice(0, separator);
                    const value = line.slice(separator + 1).replace(/^ /, "");

                    if (field === "event") {
                        event = value;
                    } else if (field === "data") {
                        dataLines.push(value);
                    }
                }

                if (dataLines.length === 0) return;

                const data = JSON.parse(dataLines.join("\n"));

                switch (event) {
                    case "status":
                        setStreamStatus(data.message);
                        break;

                    case "route":
                        setSelectedRoute(data.route);
                        break;

                    case "token":
                        fullResponse += data.content;

                        setMessages((previous) => {
                            const updated = [...previous];
                            const lastIndex = updated.length - 1;

                            updated[lastIndex] = {
                                role: "assistant",
                                content: fullResponse,
                            };

                            return updated;
                        });
                        break;

                    case "done":
                        receivedDone = true;
                        setStreamStatus("");
                        break;

                    case "error":
                        throw new Error(data.message || "An error occurred.");
                }
            }

            while (true) {
                const { value, done } = await reader.read();

                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                let boundary: number;

                while ((boundary = buffer.indexOf("\n\n")) !== -1) {
                    const frame = buffer.slice(0, boundary);
                    buffer = buffer.slice(boundary + 2);

                    if (frame.trim()) {
                        processSSEFrame(frame);
                    }
                }
            }

            // Flush decoder and process any remaining event
            buffer += decoder.decode();

            if (buffer.trim()) {
                processSSEFrame(buffer);
            }

            if (!receivedDone) {
                throw new Error("The response stream ended unexpectedly.");
            }

        } catch (err) {
            console.error("Diagnosis error:", err);

            setMessages((previous) => {
                const updated = [...previous];
                updated.pop();
                return updated;
            });

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to connect to EmbeddedSense."
            );

        } finally {
            setLoading(false);
            setStreamStatus("");
            textareaRef.current?.focus();
        }
    }

    function handleKeyDown(
        e: React.KeyboardEvent<HTMLTextAreaElement>
    ) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    }

    const canSubmit = prompt.trim().length > 0 && !loading;

    return (
        <main className="min-h-screen bg-[#100e10] text-[#f6f1f2]">

            {/* Header */}
            <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-[#100e10]/95 px-6 py-5 backdrop-blur-md md:px-10">

                <a
                    href="/"
                    className="text-xl font-semibold tracking-tight"
                >
                    EmbeddedSense
                </a>

                <div className="flex items-center gap-5">
                    <span className="text-xs text-white/40">
                        Guest session
                    </span>

                    <a
                        href="/login"
                        className="rounded-full bg-[#efa4a5] px-5 py-2.5 text-sm font-medium text-black transition hover:bg-[#f5b7b7]"
                    >
                        Sign in
                    </a>
                </div>
            </header>

            {/* Workspace */}
            <section className="mx-auto flex min-h-[85vh] max-w-5xl flex-col px-5 py-12">

                {/* Empty State */}
                {messages.length === 0 ? (

                    <div className="my-auto">

                        <div className="mb-10 text-center">

                            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-[#efa4a5]">
                                Hardware Intelligence
                            </p>

                            <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
                                What are you trying to diagnose?
                            </h1>

                            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/50">
                                Describe your hardware issue, share observed
                                symptoms, or enter measured values. EmbeddedSense
                                will investigate possible causes using its
                                technical knowledge base.
                            </p>

                        </div>

                        {/* Prompt Box */}
                        <div className="rounded-2xl border border-white/10 bg-[#191518] p-5 transition focus-within:border-[#efa4a5]/40">

                            <textarea
                                ref={textareaRef}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Example: My ESP32 resets whenever the motor starts. The 3.3V rail drops to 2.7V..."
                                className="min-h-36 w-full resize-none bg-transparent text-sm leading-7 text-white outline-none placeholder:text-white/30"
                            />

                            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">

                                <span className="text-xs text-white/35">
                                    Enter to diagnose · Shift + Enter for a new line
                                </span>

                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={!canSubmit}
                                    className="rounded-full bg-[#efa4a5] px-7 py-3 text-sm font-semibold text-black transition hover:bg-[#f5b7b7] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Diagnose →
                                </button>

                            </div>
                        </div>

                        {/* Example Prompts */}
                        <div className="mt-9 text-center">

                            <p className="mb-5 text-xs uppercase tracking-widest text-white/30">
                                Try an example
                            </p>

                            <div className="flex flex-wrap justify-center gap-3">

                                {EXAMPLES.map((example) => (
                                    <button
                                        key={example}
                                        type="button"
                                        onClick={() => {
                                            setPrompt(example);
                                            textareaRef.current?.focus();
                                        }}
                                        className="rounded-full border border-white/10 px-4 py-3 text-xs text-white/60 transition hover:border-[#efa4a5]/50 hover:text-white"
                                    >
                                        {example}
                                    </button>
                                ))}

                            </div>
                        </div>

                    </div>

                ) : (

                    /* Conversation View */
                    <div className="flex flex-1 flex-col">

                        <div className="mb-8">
                            <p className="text-xs uppercase tracking-[0.2em] text-[#efa4a5]">
                                EmbeddedSense Diagnosis
                            </p>

                            <h1 className="mt-2 text-2xl font-semibold">
                                Hardware investigation
                            </h1>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 space-y-9 pb-10">

                            {messages.map((message, index) => (

                                <div
                                    key={index}
                                    className={
                                        message.role === "user"
                                            ? "ml-auto max-w-2xl rounded-2xl border border-white/10 bg-[#272126] p-5"
                                            : "max-w-3xl py-2"
                                    }
                                >

                                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#efa4a5]">
                                        {message.role === "user"
                                            ? "You"
                                            : "EmbeddedSense"}
                                    </p>

                                    <div className="whitespace-pre-wrap break-words text-sm leading-7 text-white/80">
                                        {message.content ||
                                            (loading && index === messages.length - 1
                                                ? "Investigating your hardware issue..."
                                                : "")}
                                    </div>

                                    {/* Route and processing status */}
                                    {message.role === "assistant" &&
                                        loading &&
                                        index === messages.length - 1 && (
                                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/40">
                                                {selectedRoute && (
                                                    <span className="rounded-full border border-[#efa4a5]/20 px-3 py-1 text-[#efa4a5]">
                                                        {selectedRoute.toUpperCase()} route
                                                    </span>
                                                )}

                                                {streamStatus && (
                                                    <span>{streamStatus}</span>
                                                )}
                                            </div>
                                        )}

                                    {message.role === "assistant" &&
                                        loading &&
                                        index === messages.length - 1 &&
                                        message.content && (
                                            <span className="ml-1 inline-block h-3 w-1 animate-pulse bg-[#efa4a5]" />
                                        )}

                                </div>

                            ))}

                            <div ref={messagesEndRef} />

                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
                                {error}
                            </div>
                        )}

                        {/* Follow-up Input */}
                        <div className="sticky bottom-4 rounded-2xl border border-white/10 bg-[#191518] p-4 shadow-2xl">

                            <textarea
                                ref={textareaRef}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask a follow-up question..."
                                className="min-h-20 w-full resize-none bg-transparent text-sm leading-7 text-white outline-none placeholder:text-white/30"
                            />

                            <div className="flex items-center justify-between border-t border-white/10 pt-3">

                                <span className="text-xs text-white/35">
                                    {loading
                                        ? streamStatus || "Investigating..."
                                        : "Shift + Enter for a new line"}
                                </span>

                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={!canSubmit}
                                    className="rounded-full bg-[#efa4a5] px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-[#f5b7b7] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    {loading ? "Investigating..." : "Send →"}
                                </button>

                            </div>
                        </div>

                    </div>

                )}

                {/* Footer */}
                <p className="mt-10 text-center text-xs text-white/30">
                    Guest sessions are temporary. Sign in to save your diagnosis history.
                </p>

            </section>
        </main>
    );
}
