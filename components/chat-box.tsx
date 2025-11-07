"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { sendChatMessage, getSessionState, ChatMessage, getGeneralMessages, sendGeneralChatMessage } from "@/app/actions";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ChatBoxProps {
  sessionId?: string;
  userName: string;
  isTeacher: boolean;
  isGeneral?: boolean;
}

export function ChatBox({ sessionId = "", userName, isTeacher, isGeneral = false }: ChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchMessages = async () => {
    if (isGeneral) {
      const result = await getGeneralMessages();
      if (result.success && result.messages) {
        setMessages(result.messages);
      }
      return;
    }
    const result = await getSessionState(sessionId);
    if (result.success && result.messages) {
      setMessages(result.messages);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchMessages();

    // Poll every 3 seconds
    const interval = setInterval(fetchMessages, 3000);

    return () => clearInterval(interval);
  }, [sessionId, isGeneral]);


  const handleSend = async () => {
    if (!newMessage.trim()) return;

    setIsLoading(true);
    const result = isGeneral
      ? await sendGeneralChatMessage(newMessage, userName)
      : await sendChatMessage(sessionId, newMessage, userName);
    setIsLoading(false);

    if (result.success) {
      setNewMessage("");
      // Immediately fetch new messages
      await fetchMessages();
    } else {
      toast.error(result.error || "Failed to send message");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chat</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-64 overflow-y-auto space-y-2 border rounded-lg p-4">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No messages yet. Start the conversation!
            </p>
          ) : (
            messages.map((message, index) => {
              const isTeacherMessage = message.senderName.toLowerCase().includes("teacher") || 
                                      isTeacher && message.senderName === userName;
              return (
                <div
                  key={index}
                  className={`flex flex-col gap-1 ${
                    message.senderName === userName ? "items-end" : "items-start"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{message.senderName}</span>
                    {isTeacherMessage && (
                      <Badge variant="secondary" className="text-xs">
                        Teacher
                      </Badge>
                    )}
                  </div>
                  <div
                    className={`rounded-lg px-3 py-2 max-w-[80%] ${
                      message.senderName === userName
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
          />
          <Button onClick={handleSend} disabled={isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

