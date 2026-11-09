
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

type Message = {
    role: "user" | "assistant";
    content: string;
};

type Conversation = {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
};

type DiagnoseWorkspaceProps = {
    user: {
        id: string;
        name: string;
        email: string;
    };
};

const EXAMPLES = [
    {
        title: "Power supply issue",
        description: "My voltage regulator is overheating",
        icon: "⚡",
    },
    {
        title: "Microcontroller issue",
        description: "My ESP32 keeps restarting when a motor starts",
        icon: "◈",
    },
    {
        title: "Communication issue",
        description: "My STM32 board is not detected over USB",
        icon: "⌘",
    },
];

export default function DiagnoseWorkspace({
    user,
}: DiagnoseWorkspaceProps) {
    const router = useRouter();
    const supabase = createClient();

    const [prompt, setPrompt] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [conversationId, setConversationId] = useState<string | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Load conversation history
    async function loadConversations() {
        setLoadingHistory(true);

        const { data, error } = await supabase
            .from("conversations")
            .select("id, title, created_at, updated_at")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false });

        if (error) {
            console.error("History loading error:", error);
            setError("Unable to load conversation history.");
        } else {
            setConversations(data ?? []);
        }

        setLoadingHistory(false);
    }

    // Load history when dashboard opens
    useEffect(() => {
        loadConversations();
    }, [user.id]);

    // Open an existing conversation
    async function openConversation(id: string) {
        if (loading) return;

        setError("");

        const { data, error } = await supabase
            .from("messages")
            .select("role, content")
            .eq("conversation_id", id)
            .eq("user_id", user.id)
            .order("created_at", { ascending: true });

        if (error) {
            console.error("Conversation loading error:", error);
            setError("Unable to open this conversation.");
            return;
        }

        setConversationId(id);
        setMessages(data ?? []);
        setPrompt("");
        setSidebarOpen(false);
    }

    // Scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end",
        });
    }, [messages]);

    // Start a new diagnosis
    function handleNewDiagnosis() {
        if (loading) return;

        setConversationId(null);
        setMessages([]);
        setPrompt("");
        setError("");
        setSidebarOpen(false);
        textareaRef.current?.focus();
    }

    // Submit diagnosis request
    async function handleSubmit() {
        const question = prompt.trim();

        if (!question || loading) return;

        setPrompt("");
        setError("");
        setLoading(true);

        let activeConversationId = conversationId;

        try {
            // 1. Create a new conversation if required
            if (!activeConversationId) {
                const title =
                    question.length > 50
                        ? question.substring(0, 50) + "..."
                        : question;

                const { data: conversation, error: conversationError } =
                    await supabase
                        .from("conversations")
                        .insert({
                            user_id: user.id,
                            title,
                        })
                        .select("id")
                        .single();

                if (conversationError) {
                    throw conversationError;
                }

                activeConversationId = conversation.id;
                setConversationId(conversation.id);
            }

            // Ensure we have a conversation ID
            if (!activeConversationId) {
                throw new Error("Unable to create a conversation.");
            }

            // 2. Save user's question
            const { error: userMessageError } = await supabase
                .from("messages")
                .insert({
                    conversation_id: activeConversationId,
                    user_id: user.id,
                    role: "user",
                    content: question,
                });

            if (userMessageError) {
                throw userMessageError;
            }

            // 3. Display user question and assistant placeholder
            setMessages((previous) => [
                ...previous,
                { role: "user", content: question },
                { role: "assistant", content: "" },
            ]);

            // 4. Call existing RAG backend
            const apiUrl =
                process.env.NEXT_PUBLIC_API_URL ||
                "http://127.0.0.1:8000";

            const response = await fetch(`${apiUrl}/llm`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    prompt: question,
                }),
            });

            if (!response.ok) {
                throw new Error(`Backend error: ${response.status}`);
            }

            if (!response.body) {
                throw new Error("No response stream received.");
            }

            // 5. Stream AI response
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            let fullResponse = "";

            while (true) {
                const { value, done } = await reader.read();

                if (done) break;

                const chunk = decoder.decode(value, {
                    stream: true,
                });

                if (!chunk) continue;

                for (const character of chunk) {
                    fullResponse += character;

                    setMessages((previous) => {
                        const updated = [...previous];
                        const lastIndex = updated.length - 1;

                        updated[lastIndex] = {
                            role: "assistant",
                            content: fullResponse,
                        };

                        return updated;
                    });

                    await new Promise((resolve) =>
                        setTimeout(resolve, 10)
                    );
                }
            }

            // 6. Flush remaining decoder buffer
            const remaining = decoder.decode();

            if (remaining) {
                fullResponse += remaining;

                setMessages((previous) => {
                    const updated = [...previous];
                    const lastIndex = updated.length - 1;

                    updated[lastIndex] = {
                        role: "assistant",
                        content: fullResponse,
                    };

                    return updated;
                });
            }

            if (!fullResponse.trim()) {
                throw new Error("The backend returned an empty response.");
            }

            // 7. Save completed assistant response
            const { error: assistantMessageError } = await supabase
                .from("messages")
                .insert({
                    conversation_id: activeConversationId,
                    user_id: user.id,
                    role: "assistant",
                    content: fullResponse,
                });

            if (assistantMessageError) {
                console.error(
                    "Assistant response saving error:",
                    assistantMessageError
                );

                setError(
                    "Diagnosis completed, but the AI response could not be saved."
                );
            }

            // 8. Update conversation timestamp
            const { error: updateError } = await supabase
                .from("conversations")
                .update({
                    updated_at: new Date().toISOString(),
                })
                .eq("id", activeConversationId)
                .eq("user_id", user.id);

            if (updateError) {
                console.error("Conversation update error:", updateError);
            }

            // 9. Refresh sidebar history
            await loadConversations();

        } catch (err) {
            console.error("Diagnosis error:", err);

            // Remove incomplete assistant placeholder
            setMessages((previous) => {
                const updated = [...previous];

                if (
                    updated.length > 0 &&
                    updated[updated.length - 1].role === "assistant" &&
                    !updated[updated.length - 1].content
                ) {
                    updated.pop();
                }

                return updated;
            });

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to complete diagnosis."
            );
        } finally {
            setLoading(false);
            textareaRef.current?.focus();
        }
    }

    // Enter to submit, Shift + Enter for new line
    function handleKeyDown(
        e: React.KeyboardEvent<HTMLTextAreaElement>
    ) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    }

    // Sign out
    async function handleLogout() {
        const { error } = await supabase.auth.signOut();

        if (error) {
            setError("Unable to sign out. Please try again.");
            return;
        }

        router.replace("/login");
        router.refresh();
    }

    const canSubmit = prompt.trim().length > 0 && !loading;

    return (
        <main className="flex h-screen overflow-hidden bg-[#100e10] text-[#f6f1f2]">

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 flex w-72 flex-col
                    border-r border-white/10 bg-[#151215]
                    transition-transform duration-300
                    lg:static lg:translate-x-0
                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
                `}
            >
                {/* Brand */}
                <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
                    <a
                        href="/"
                        className="text-xl font-semibold tracking-tight"
                    >
                        Embedded<span className="text-[#efa4a5]">Sense</span>
                    </a>

                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="text-white/50 hover:text-white lg:hidden"
                        aria-label="Close sidebar"
                    >
                        ✕
                    </button>
                </div>

                {/* New diagnosis */}
                <div className="p-5">
                    <button
                        onClick={handleNewDiagnosis}
                        disabled={loading}
                        className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#efa4a5] px-4 py-3.5 text-sm font-semibold text-[#100e10] transition hover:bg-[#f5b7b7] disabled:opacity-40"
                    >
                        <span className="text-lg">＋</span>
                        New Diagnosis
                    </button>
                </div>

                {/* Conversation history */}
                <div className="flex-1 overflow-y-auto px-5 py-3">
                    <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
                        Workspace
                    </p>

                    {loadingHistory ? (
                        <p className="py-5 text-center text-xs text-white/40">
                            Loading history...
                        </p>
                    ) : conversations.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-white/10 px-4 py-7 text-center">
                            <div className="mb-3 text-2xl text-white/25">
                                ◷
                            </div>

                            <p className="text-xs font-medium text-white/60">
                                No saved diagnoses
                            </p>

                            <p className="mt-2 text-[11px] leading-5 text-white/30">
                                Your saved conversations will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {conversations.map((conversation) => (
                                <button
                                    key={conversation.id}
                                    onClick={() =>
                                        openConversation(conversation.id)
                                    }
                                    disabled={loading}
                                    className={`
                                        w-full rounded-xl px-3 py-3 text-left
                                        transition hover:bg-white/5
                                        disabled:opacity-40
                                        ${
                                            conversationId === conversation.id
                                                ? "border border-[#efa4a5]/30 bg-[#efa4a5]/10"
                                                : "border border-transparent"
                                        }
                                    `}
                                >
                                    <p className="truncate text-xs font-medium text-white/80">
                                        {conversation.title}
                                    </p>

                                    <p className="mt-1 text-[10px] text-white/35">
                                        {new Date(
                                            conversation.updated_at
                                        ).toLocaleDateString()}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Account */}
                <div className="border-t border-white/10 p-5">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#efa4a5]/15 text-sm font-semibold text-[#efa4a5]">
                            {user.name.charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                                {user.name}
                            </p>

                            <p className="truncate text-[11px] text-white/40">
                                {user.email}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-white/50 transition hover:bg-white/5 hover:text-white"
                    >
                        <span>↗</span>
                        Sign out
                    </button>
                </div>
            </aside>

            {/* Main workspace */}
            <section className="flex min-w-0 flex-1 flex-col">

                {/* Top navigation */}
                <header className="flex h-20 shrink-0 items-center justify-between border-b border-white/10 px-5 md:px-8">

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="text-xl text-white/60 hover:text-white lg:hidden"
                            aria-label="Open sidebar"
                        >
                            ☰
                        </button>

                        <div>
                            <p className="text-sm font-medium">
                                Engineering Workspace
                            </p>

                            <p className="mt-1 text-[10px] uppercase tracking-widest text-white/35">
                                Hardware Intelligence
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span className="text-[10px] text-white/50">
                            Workspace active
                        </span>
                    </div>
                </header>

                {/* Content */}
                <div className="flex min-h-0 flex-1 flex-col">

                    {messages.length === 0 ? (

                        /* Initial workspace */
                        <div className="flex flex-1 items-center justify-center overflow-y-auto px-5 py-12">

                            <div className="w-full max-w-4xl">

                                <div className="mb-12">
                                    <p className="mb-5 text-xs font-semibold uppercase tracking-[0.25em] text-[#efa4a5]">
                                        Diagnostic Intelligence / 01
                                    </p>

                                    <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
                                        Understand the fault.
                                        <span className="block text-white/35">
                                            Find the cause.
                                        </span>
                                    </h1>

                                    <p className="mt-6 max-w-xl text-sm leading-7 text-white/45">
                                        Describe your hardware problem,
                                        provide observed symptoms or measured
                                        values. EmbeddedSense will investigate
                                        possible causes using its technical
                                        knowledge base.
                                    </p>
                                </div>

                                {/* Diagnostic input */}
                                <div className="rounded-2xl border border-white/10 bg-[#191518] p-5 transition focus-within:border-[#efa4a5]/40">

                                    <textarea
                                        ref={textareaRef}
                                        value={prompt}
                                        onChange={(e) =>
                                            setPrompt(e.target.value)
                                        }
                                        onKeyDown={handleKeyDown}
                                        placeholder="Describe your hardware issue. Include board model, symptoms, measured voltages, error logs..."
                                        className="min-h-36 w-full resize-none bg-transparent text-sm leading-7 text-white outline-none placeholder:text-white/30"
                                    />

                                    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">

                                        <span className="text-[11px] text-white/35">
                                            Enter to submit · Shift + Enter for a new line
                                        </span>

                                        <button
                                            onClick={handleSubmit}
                                            disabled={!canSubmit}
                                            className="rounded-full bg-[#efa4a5] px-7 py-3 text-sm font-semibold text-[#100e10] transition hover:bg-[#f5b7b7] disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Run Diagnosis →
                                        </button>
                                    </div>
                                </div>

                                {/* Example prompts */}
                                <div className="mt-10">
                                    <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
                                        Explore diagnostic scenarios
                                    </p>

                                    <div className="grid gap-3 md:grid-cols-3">

                                        {EXAMPLES.map((example) => (
                                            <button
                                                key={example.title}
                                                onClick={() => {
                                                    setPrompt(
                                                        example.description
                                                    );
                                                    textareaRef.current?.focus();
                                                }}
                                                className="rounded-xl border border-white/10 bg-[#151215] p-4 text-left transition hover:border-[#efa4a5]/40 hover:bg-[#191518]"
                                            >
                                                <div className="mb-4 text-xl text-[#efa4a5]">
                                                    {example.icon}
                                                </div>

                                                <p className="text-xs font-semibold text-white/80">
                                                    {example.title}
                                                </p>

                                                <p className="mt-2 text-[11px] leading-5 text-white/40">
                                                    {example.description}
                                                </p>
                                            </button>
                                        ))}

                                    </div>
                                </div>

                                {error && (
                                    <div className="mt-6 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
                                        {error}
                                    </div>
                                )}

                                <p className="mt-10 text-center text-[10px] text-white/25">
                                    AI-generated diagnostic guidance should be verified against physical measurements and component specifications.
                                </p>

                            </div>
                        </div>

                    ) : (

                        /* Conversation view */
                        <>
                            <div className="flex-1 overflow-y-auto px-5 py-10 md:px-10">

                                <div className="mx-auto max-w-3xl">

                                    <div className="mb-10">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#efa4a5]">
                                            Diagnostic Session
                                        </p>

                                        <h1 className="mt-2 text-2xl font-semibold">
                                            Hardware investigation
                                        </h1>
                                    </div>

                                    <div className="space-y-10">

                                        {messages.map((message, index) => (
                                            <div
                                                key={index}
                                                className={
                                                    message.role === "user"
                                                        ? "ml-auto max-w-2xl rounded-2xl border border-white/10 bg-[#272126] p-5"
                                                        : "max-w-3xl py-2"
                                                }
                                            >
                                                <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[#efa4a5]">
                                                    {message.role === "user"
                                                        ? "You"
                                                        : "EmbeddedSense"}
                                                </p>

                                                <div className="whitespace-pre-wrap break-words text-sm leading-7 text-white/80">
                                                    {message.content ||
                                                        (loading &&
                                                        index === messages.length - 1
                                                            ? "Investigating your hardware issue..."
                                                            : "")}
                                                </div>

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
                                </div>
                            </div>

                            {/* Follow-up input */}
                            <div className="shrink-0 border-t border-white/10 bg-[#100e10] px-5 py-5 md:px-10">
                                <div className="mx-auto max-w-3xl">

                                    {error && (
                                        <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
                                            {error}
                                        </div>
                                    )}

                                    <div className="rounded-2xl border border-white/10 bg-[#191518] p-4 focus-within:border-[#efa4a5]/40">

                                        <textarea
                                            ref={textareaRef}
                                            value={prompt}
                                            onChange={(e) =>
                                                setPrompt(e.target.value)
                                            }
                                            onKeyDown={handleKeyDown}
                                            placeholder="Ask a follow-up question..."
                                            className="min-h-20 w-full resize-none bg-transparent text-sm leading-7 text-white outline-none placeholder:text-white/30"
                                        />

                                        <div className="flex items-center justify-between border-t border-white/10 pt-3">

                                            <span className="text-[10px] text-white/35">
                                                {loading
                                                    ? "Investigating..."
                                                    : "Shift + Enter for a new line"}
                                            </span>

                                            <button
                                                onClick={handleSubmit}
                                                disabled={!canSubmit}
                                                className="rounded-full bg-[#efa4a5] px-6 py-2.5 text-sm font-semibold text-[#100e10] transition hover:bg-[#f5b7b7] disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                {loading
                                                    ? "Investigating..."
                                                    : "Send →"}
                                            </button>

                                        </div>
                                    </div>

                                    <p className="mt-3 text-center text-[10px] text-white/25">
                                        Verify AI-generated recommendations before applying hardware changes.
                                    </p>

                                </div>
                            </div>
                        </>
                    )}
                </div>
            </section>
        </main>
    );
}
