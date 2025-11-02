"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ContentDisplay } from "@/components/content-display";
import { ChatBox } from "@/components/chat-box";
import { getSessionState, awardPoint, SharedContent } from "@/app/actions";
import { toast } from "sonner";
import { Copy, Check } from "lucide-react";

export default function SessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [content, setContent] = useState<SharedContent | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const name = sessionStorage.getItem("userName");
    const role = sessionStorage.getItem("userRole");

    if (!name) {
      router.push("/");
      return;
    }

    setUserName(name);
    setUserRole(role);

    // Initial fetch
    fetchSessionState(name);

    // Poll every 2 seconds for content updates
    const interval = setInterval(() => {
      fetchSessionState(name);
    }, 2000);

    return () => clearInterval(interval);
  }, [sessionId, router]);

  const fetchSessionState = async (name: string) => {
    const result = await getSessionState(sessionId, name);
    if (result.success) {
      if (result.content) {
        setContent(result.content);
      }
    }
  };

  const handleCopySessionId = async () => {
    try {
      await navigator.clipboard.writeText(sessionId);
      setCopied(true);
      toast.success("Session ID copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy session ID");
    }
  };

  const handleRewardSender = async () => {
    if (!content?.senderName) return;

    const result = await awardPoint(content.senderName);
    if (result.success) {
      toast.success(`Rewarded ${content.senderName} with 1 point!`);
    } else {
      toast.error(result.error || "Failed to award point");
    }
  };

  if (!userName) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const isTeacher = userRole === "teacher";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Session ID</p>
                  <p className="font-mono font-semibold text-lg">{sessionId}</p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopySessionId}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ContentDisplay
                content={content}
                sessionId={sessionId}
                isTeacher={isTeacher}
                onRewardSender={
                  !isTeacher && content?.senderName !== userName
                    ? handleRewardSender
                    : undefined
                }
              />
            </div>
            <div>
              <ChatBox
                sessionId={sessionId}
                userName={userName}
                isTeacher={isTeacher}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

