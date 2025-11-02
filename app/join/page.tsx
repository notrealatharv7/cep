"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { joinSession, receiveContent } from "@/app/actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function JoinPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string>("");
  const [contentId, setContentId] = useState<string>("");
  const [isJoiningSession, setIsJoiningSession] = useState(false);
  const [isReceivingContent, setIsReceivingContent] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // Check if student is logged in
    const userName = sessionStorage.getItem("userName");
    const userRole = sessionStorage.getItem("userRole");

    if (!userName || userRole !== "student") {
      router.push("/");
    }
  }, [router]);

  const handleJoinSession = async () => {
    if (!sessionId.trim()) {
      setError("Please enter a session ID");
      return;
    }

    setIsJoiningSession(true);
    setError("");

    const result = await joinSession(sessionId.trim());

    if (result.success) {
      toast.success("Joined session successfully!");
      router.push(`/session/${sessionId.trim()}`);
    } else {
      setError(result.error || "Failed to join session");
      toast.error(result.error || "Failed to join session");
    }

    setIsJoiningSession(false);
  };

  const handleReceiveContent = async () => {
    if (!contentId.trim()) {
      setError("Please enter a content ID");
      return;
    }

    setIsReceivingContent(true);
    setError("");

    const result = await receiveContent(contentId.trim());

    if (result.success && result.content) {
      toast.success("Content received!");
      // Redirect to session page with content
      router.push(`/session/${contentId.trim()}`);
    } else {
      setError(result.error || "Content not found");
      toast.error(result.error || "Content not found");
    }

    setIsReceivingContent(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Join Live Session</CardTitle>
              <CardDescription>
                Enter the session ID provided by your teacher
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  placeholder="Enter session ID"
                  className="font-mono"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleJoinSession();
                    }
                  }}
                />
              </div>
              <Button
                onClick={handleJoinSession}
                disabled={isJoiningSession}
                className="w-full"
                size="lg"
              >
                {isJoiningSession ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Join Session"
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Receive Shared Content</CardTitle>
              <CardDescription>
                Enter the share code to receive one-off content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  value={contentId}
                  onChange={(e) => setContentId(e.target.value)}
                  placeholder="Enter share code"
                  className="font-mono"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleReceiveContent();
                    }
                  }}
                />
              </div>
              <Button
                onClick={handleReceiveContent}
                disabled={isReceivingContent}
                variant="outline"
                className="w-full"
                size="lg"
              >
                {isReceivingContent ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Receive Content"
                )}
              </Button>
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}

