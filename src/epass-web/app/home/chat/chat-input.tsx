'use client';

import { useChat } from '@ai-sdk/react';
import { useRef, useEffect, useState } from 'react';
import {
    Send,
    User,
    Sparkles,
    AlertCircle,
    Loader2,
    FileText,
    Link as LinkIcon
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from 'react-i18next';

export function ChatInput() {
    const { t } = useTranslation();
    const {
        messages,
        sendMessage,
        status,
        error
    } = useChat();

    const [input, setInput] = useState("");
    const isLoading = status === 'submitted' || status === 'streaming';
    const chatContainerRef = useRef<HTMLDivElement | null>(null);

    // Show a typing indicator while the assistant is responding but hasn't
    // produced any visible text yet (request sent / tool calls running).
    const lastMessage = messages[messages.length - 1];
    const assistantIsTyping =
        isLoading &&
        (!lastMessage ||
            lastMessage.role !== 'assistant' ||
            !lastMessage.parts?.some((p: any) => p.type === 'text' && p.text?.trim()));

    // Turn the raw error into a friendly, accurate message. The server's onError
    // already returns actionable strings (rate limit, bad key, etc.); only fall
    // back to a generic message for transport/network failures.
    const errorText = error
        ? /failed to fetch|networkerror|load failed/i.test(error.message || "")
            ? t('dashboard.chat.errorReach')
            : error.message || t('dashboard.chat.errorUnavailable')
        : null;

    // Scroll to bottom on message updates
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages, assistantIsTyping]);

    return (
        <Card className="glass-panel p-4 flex flex-col space-y-4 border border-primary/10 bg-primary/1">
            {/* Header / Info line */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground select-none">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span className="font-semibold text-foreground">ePass AI</span>
                    <span>• {t('dashboard.chat.askQuery')}</span>
                </div>
                {isLoading && (
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        {t('dashboard.chat.aiThinking')}
                    </Badge>
                )}
            </div>

            {/* Chat History Area (Only visible when there are messages) */}
            {messages.length > 0 && (
                <ScrollArea
                    ref={chatContainerRef}
                    className="max-h-72 overflow-y-hidden pr-1 space-y-4 text-sm pb-2 border-b border-border/40 h-[calc(100vh-8rem)]"
                >
                    {messages.map((message) => {
                        const isUser = message.role === 'user';
                        return (
                            <div key={message.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} my-2 mr-4`}>

                                {/* Icon for AI */}
                                {!isUser && (
                                    <div className="w-7 h-7 rounded-lg border border-primary/20 bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                        <Sparkles className="w-4 h-4" />
                                    </div>
                                )}

                                {/* Message Bubble */}
                                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 space-y-3 ${
                                    isUser
                                        ? 'bg-primary/15 border border-primary/20 text-foreground rounded-tr-none'
                                        : 'bg-muted/50 border border-border/40 text-foreground rounded-tl-none'
                                }`}>
                                    {/* Render Message Parts */}
                                    {message.parts.map((part, idx) => {
                                        if (part.type === 'text') {
                                            return (
                                                <p key={idx} className="leading-relaxed text-xs sm:text-sm whitespace-pre-line">
                                                    {part.text}
                                                </p>
                                            );
                                        }

                                        if (part.type === 'tool-prepareContract') {
                                            const toolPart = part as any;
                                            if (toolPart.state === 'output-available' && toolPart.output?.status === 'success') {
                                                const preview = toolPart.output.preview;
                                                return (
                                                    <div key={toolPart.toolCallId} className="mt-2 p-3 bg-black/10 dark:bg-white/5 border border-primary/20 rounded-xl space-y-3">
                                                        <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                                                            <FileText className="w-4 h-4 text-primary" />
                                                            <span className="font-semibold text-xs text-foreground uppercase tracking-wider">
                                                                {t('dashboard.chat.draftTitle', { title: preview.title })}
                                                            </span>
                                                        </div>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                                                            <div>
                                                                <span className="font-medium text-foreground">{t('dashboard.chat.cautionLabel')}</span> {preview.cautionAmountUSDC} USDC
                                                            </div>
                                                            <div>
                                                                <span className="font-medium text-foreground">{t('dashboard.chat.playerEmailLabel')}</span> {preview.playerEmail}
                                                            </div>
                                                            <div>
                                                                <span className="font-medium text-foreground">{t('dashboard.chat.tokenLabel')}</span> {preview.tokenName} ({preview.tokenSymbol})
                                                            </div>
                                                        </div>

                                                        <Link
                                                            href={toolPart.output.redirectUrl}
                                                            className="flex items-center justify-center gap-1.5 w-full py-2 px-3 text-xs bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded-lg transition-colors text-center"
                                                        >
                                                            <LinkIcon className="w-3.5 h-3.5" />
                                                            {t('dashboard.chat.reviewSubmit')}
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
                                    <div className="w-7 h-7 rounded-lg border border-border bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0">
                                        <User className="w-4 h-4" />
                                    </div>
                                )}

                            </div>
                        );
                    })}

                    {/* Typing indicator while the assistant is composing a reply */}
                    {assistantIsTyping && (
                        <div className="flex gap-3 justify-start">
                            <div className="w-7 h-7 rounded-lg border border-primary/20 bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                <Sparkles className="w-4 h-4 animate-pulse" />
                            </div>
                            <div className="bg-muted/50 border border-border/40 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce" />
                            </div>
                        </div>
                    )}
                </ScrollArea>
            )}

            {/* Error Message banner — shows the real, actionable reason */}
            {errorText && (
                <div className="p-3 border border-red-500/30 bg-red-500/10 text-red-500 text-xs rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
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
                <div className="glass-input rounded-2xl px-4 py-3 flex-1 flex items-center border border-border/60 hover:border-primary/20 focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={t('dashboard.chat.messageAiPlaceholder')}
                        className="bg-transparent flex-1 outline-none text-foreground text-sm placeholder:text-muted-foreground"
                        disabled={isLoading}
                    />
                </div>
                <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="p-3 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-2xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
                >
                    <Send className="w-4 h-4" />
                </button>
            </form>

        </Card>
    );
}
