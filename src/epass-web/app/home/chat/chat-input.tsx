"use client";

import { useChat } from "@ai-sdk/react";
import {
    AlertCircle,
    FileText,
    Link as LinkIcon,
    Loader2,
    Send,
    Sparkles,
    User,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ChatInput() {
    const { t } = useTranslation();
    const { messages, sendMessage, status, error } = useChat();

    const [input, setInput] = useState("");
    const isLoading = status === "submitted" || status === "streaming";
    const chatContainerRef = useRef<HTMLDivElement | null>(null);

    // Show a typing indicator while the assistant is responding but hasn't
    // produced any visible text yet (request sent / tool calls running).
    const lastMessage = messages[messages.length - 1];
    const assistantIsTyping =
        isLoading &&
        (!lastMessage ||
            lastMessage.role !== "assistant" ||
            !lastMessage.parts?.some(
                (p: any) => p.type === "text" && p.text?.trim(),
            ));

    // Turn the raw error into a friendly, accurate message. The server's onError
    // already returns actionable strings (rate limit, bad key, etc.); only fall
    // back to a generic message for transport/network failures.
    const errorText = error
        ? /failed to fetch|networkerror|load failed/i.test(error.message || "")
            ? t("dashboard.chat.errorReach")
            : error.message || t("dashboard.chat.errorUnavailable")
        : null;

    // Scroll to bottom on message updates
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: "smooth",
            });
        }
    }, [messages, assistantIsTyping]);

    return (
        <Card className="glass-panel flex flex-col space-y-4 border border-primary/10 bg-primary/1 p-4">
            {/* Header / Info line */}
            <div className="flex items-center justify-between">
                <div className="flex select-none items-center gap-1.5 text-muted-foreground text-xs">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span className="font-semibold text-foreground">
                        ePass AI
                    </span>
                    <span>• {t("dashboard.chat.askQuery")}</span>
                </div>
                {isLoading && (
                    <Badge
                        variant="outline"
                        className="animate-pulse border-primary/20 bg-primary/5 text-[10px] text-primary"
                    >
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        {t("dashboard.chat.aiThinking")}
                    </Badge>
                )}
            </div>

            {/* Chat History Area (Only visible when there are messages) */}
            {messages.length > 0 && (
                <ScrollArea
                    ref={chatContainerRef}
                    className="h-[calc(100vh-8rem)] max-h-72 space-y-4 overflow-y-hidden border-border/40 border-b pr-1 pb-2 text-sm"
                >
                    {messages.map((message) => {
                        const isUser = message.role === "user";
                        return (
                            <div
                                key={message.id}
                                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} my-2 mr-4`}
                            >
                                {/* Icon for AI */}
                                {!isUser && (
                                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                                        <Sparkles className="h-4 w-4" />
                                    </div>
                                )}

                                {/* Message Bubble */}
                                <div
                                    className={`max-w-[85%] space-y-3 rounded-2xl px-4 py-2.5 ${
                                        isUser
                                            ? "rounded-tr-none border border-primary/20 bg-primary/15 text-foreground"
                                            : "rounded-tl-none border border-border/40 bg-muted/50 text-foreground"
                                    }`}
                                >
                                    {/* Render Message Parts */}
                                    {message.parts.map((part, idx) => {
                                        if (part.type === "text") {
                                            return (
                                                <p
                                                    key={idx}
                                                    className="whitespace-pre-line text-xs leading-relaxed sm:text-sm"
                                                >
                                                    {part.text}
                                                </p>
                                            );
                                        }

                                        if (
                                            part.type === "tool-prepareContract"
                                        ) {
                                            const toolPart = part as any;
                                            if (
                                                toolPart.state ===
                                                    "output-available" &&
                                                toolPart.output?.status ===
                                                    "success"
                                            ) {
                                                const preview =
                                                    toolPart.output.preview;
                                                return (
                                                    <div
                                                        key={
                                                            toolPart.toolCallId
                                                        }
                                                        className="mt-2 space-y-3 rounded-xl border border-primary/20 bg-black/10 p-3 dark:bg-white/5"
                                                    >
                                                        <div className="flex items-center gap-2 border-border/40 border-b pb-2">
                                                            <FileText className="h-4 w-4 text-primary" />
                                                            <span className="font-semibold text-foreground text-xs uppercase tracking-wider">
                                                                {t(
                                                                    "dashboard.chat.draftTitle",
                                                                    {
                                                                        title: preview.title,
                                                                    },
                                                                )}
                                                            </span>
                                                        </div>

                                                        <div className="grid grid-cols-1 gap-2 text-[11px] text-muted-foreground sm:grid-cols-2">
                                                            <div>
                                                                <span className="font-medium text-foreground">
                                                                    {t(
                                                                        "dashboard.chat.cautionLabel",
                                                                    )}
                                                                </span>{" "}
                                                                {
                                                                    preview.cautionAmountUSDC
                                                                }{" "}
                                                                USDC
                                                            </div>
                                                            <div>
                                                                <span className="font-medium text-foreground">
                                                                    {t(
                                                                        "dashboard.chat.playerEmailLabel",
                                                                    )}
                                                                </span>{" "}
                                                                {
                                                                    preview.playerEmail
                                                                }
                                                            </div>
                                                            <div>
                                                                <span className="font-medium text-foreground">
                                                                    {t(
                                                                        "dashboard.chat.tokenLabel",
                                                                    )}
                                                                </span>{" "}
                                                                {
                                                                    preview.tokenName
                                                                }{" "}
                                                                (
                                                                {
                                                                    preview.tokenSymbol
                                                                }
                                                                )
                                                            </div>
                                                        </div>

                                                        <Link
                                                            href={
                                                                toolPart.output
                                                                    .redirectUrl
                                                            }
                                                            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-center font-semibold text-primary-foreground text-xs transition-colors hover:bg-primary-hover"
                                                        >
                                                            <LinkIcon className="h-3.5 w-3.5" />
                                                            {t(
                                                                "dashboard.chat.reviewSubmit",
                                                            )}
                                                        </Link>
                                                    </div>
                                                );
                                            }
                                        }

                                        return null;
                                    })}
                                </div>

                                {/* Icon for User */}
                                {isUser && (
                                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                                        <User className="h-4 w-4" />
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Typing indicator while the assistant is composing a reply */}
                    {assistantIsTyping && (
                        <div className="flex justify-start gap-3">
                            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                                <Sparkles className="h-4 w-4 animate-pulse" />
                            </div>
                            <div className="flex items-center gap-1 rounded-2xl rounded-tl-none border border-border/40 bg-muted/50 px-4 py-3">
                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/70 [animation-delay:-0.3s]" />
                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/70 [animation-delay:-0.15s]" />
                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/70" />
                            </div>
                        </div>
                    )}
                </ScrollArea>
            )}

            {/* Error Message banner — shows the real, actionable reason */}
            {errorText && (
                <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-500 text-xs">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{errorText}</span>
                </div>
            )}

            {/* Prompt Input Form */}
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    if (input.trim()) {
                        sendMessage({ text: input });
                        setInput("");
                    }
                }}
                className="flex gap-2"
            >
                <div className="glass-input flex flex-1 items-center rounded-2xl border border-border/60 px-4 py-3 focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 hover:border-primary/20">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={t("dashboard.chat.messageAiPlaceholder")}
                        className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
                        disabled={isLoading}
                    />
                </div>
                <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="flex cursor-pointer items-center justify-center rounded-2xl bg-primary p-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <Send className="h-4 w-4" />
                </button>
            </form>

            <p className="select-none text-center text-[11px] text-muted-foreground/60 leading-normal">
                {t("dashboard.chat.instabilityNotice")}
            </p>
        </Card>
    );
}
