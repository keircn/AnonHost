import { useState, useCallback, useRef, useEffect } from "react";
import { GoogleGenAI } from "@google/genai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useSession } from "next-auth/react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export function ChatBot() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [streamingContent, setStreamingContent] = useState("");
    const { data: session } = useSession();
    const lastMessageTime = useRef<number>(0);
    const messageCount = useRef<number>(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, streamingContent, scrollToBottom]);

    const checkRateLimit = useCallback(() => {
        const now = Date.now();
        const timeSinceLastMessage = now - lastMessageTime.current;

        if (timeSinceLastMessage > 3600000) {
            messageCount.current = 0;
        }

        const limit = session?.user?.premium ? 50 : 20;
        return messageCount.current < limit;
    }, [session?.user?.premium]);

    // Debounce function
    const debounce = (func: (value: string) => void, delay: number) => {
        let timeoutId: NodeJS.Timeout;
        return function debouncedFunction(value: string) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func(value), delay);
        };
    };

    // Debounced setStreamingContent
    const debouncedSetStreamingContent = useCallback(debounce((value: string) => {
        setStreamingContent(value);
    }, 50), []); // Adjust the delay as needed

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        if (!checkRateLimit()) {
            alert("You've reached your message limit. Please try again later.");
            return;
        }

        const userMessage = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMessage }]);
        setIsLoading(true);
        setStreamingContent("");

        try {
            const response = await fetch("/api/gemini", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messages: messages.map(m => ({ role: m.role, content: m.content })),
                    userMessage: userMessage,
                }),
            });

            if (!response.body) {
                throw new Error("Response body is empty");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedResponse = "";

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    break;
                }

                accumulatedResponse += decoder.decode(value);
                debouncedSetStreamingContent(accumulatedResponse); // Use debounced function
            }

            setMessages(prev => [...prev, { role: "assistant", content: accumulatedResponse }]);
            setStreamingContent("");
            messageCount.current++;
            lastMessageTime.current = Date.now();
        } catch (error) {
            console.error("Error:", error);
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "Hmph! Something went wrong, but it's not like I care or anything! *crosses arms*"
            }]);
        }

        setIsLoading(false);
    };

    const MessageComponent = ({ message, isStreaming = false }: { message: Message, isStreaming?: boolean }) => (
        <div className={`flex items-start gap-3 ${message.role === "assistant" ? "flex-row" : "flex-row-reverse"}`}>
            <Avatar className="mt-1">
                {message.role === "assistant" ? (
                    <>
                        <AvatarImage src="/clara-avatar.png" alt="Clara" />
                        <AvatarFallback>CA</AvatarFallback>
                    </>
                ) : (
                    <>
                        <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || "User"} />
                        <AvatarFallback>{session?.user?.name?.[0] || "U"}</AvatarFallback>
                    </>
                )}
            </Avatar>
            <Card className={`p-3 flex-1 ${message.role === "assistant" ? "bg-primary/10" : "bg-muted"}`}>
                <div className="prose dark:prose-invert prose-sm">
                    <ReactMarkdown>
                        {isStreaming ? streamingContent : message.content}
                    </ReactMarkdown>
                </div>
            </Card>
        </div>
    );

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setOpen(true)}
            >
                <Sparkles className="h-5 w-5" />
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Chat with Clara</DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-col gap-4 h-[50vh] max-h-[500px]">
                        <div className="flex-1 overflow-y-auto space-y-4 p-4 rounded-md border">
                            {messages.map((message, i) => (
                                <MessageComponent key={i} message={message} />
                            ))}
                            {messages.length === 0 && (
                                <p className="text-center text-muted-foreground">
                                    *Clara taps her foot impatiently* Well? Are you going to say something or just stare at me all day?
                                </p>
                            )}
                            {streamingContent && (
                                <MessageComponent
                                    message={{ role: "assistant", content: "" }}
                                    isStreaming={true}
                                />
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={sendMessage} className="flex gap-2">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your message..."
                                disabled={isLoading}
                            />
                            <Button type="submit" disabled={isLoading}>
                                Send
                            </Button>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}