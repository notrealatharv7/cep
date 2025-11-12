"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSession } from "@/app/actions";
import { toast } from "sonner";
import { Loader2, Copy, Check } from "lucide-react";
import { ManageAccessCodeCard } from "@/components/manage-access-code";
import { SendContentForm } from "@/components/send-content-form";
import { ManageUsers } from "@/components/manage-users";

export default function CollabPage() {
  const router = useRouter();
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check if teacher is logged in
    const userName = sessionStorage.getItem("userName");
    const userRole = sessionStorage.getItem("userRole");

    if (!userName || userRole !== "teacher") {
      router.push("/");
    }
  }, [router]);

  const handleCreateSession = async () => {
    const userName = sessionStorage.getItem("userName");
    if (!userName) {
      toast.error("You must be logged in");
      return;
    }

    setIsCreatingSession(true);
    const result = await createSession(userName);

    if (result.success && result.sessionId) {
      setSessionId(result.sessionId);
      toast.success("Session created successfully!");
    } else {
      toast.error(result.error || "Failed to create session");
    }

    setIsCreatingSession(false);
  };

  const handleCopySessionId = async () => {
    if (!sessionId) return;

    try {
      await navigator.clipboard.writeText(sessionId);
      setCopied(true);
      toast.success("Session ID copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy session ID");
    }
  };

  const handleJoinSession = () => {
    if (sessionId) {
      router.push(`/session/${sessionId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="sessions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="sessions">Live Sessions</TabsTrigger>
            <TabsTrigger value="share">Share Content</TabsTrigger>
            <TabsTrigger value="users">Manage Users</TabsTrigger>
          </TabsList>

          <TabsContent value="sessions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Session</CardTitle>
                <CardDescription>
                  Start a new real-time collaboration session
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!sessionId ? (
                  <Button
                    onClick={handleCreateSession}
                    disabled={isCreatingSession}
                    size="lg"
                    className="w-full"
                  >
                    {isCreatingSession ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Session...
                      </>
                    ) : (
                      "Create New Session"
                    )}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Session ID</p>
                      <div className="flex items-center gap-2">
                        <Input
                          value={sessionId}
                          readOnly
                          className="font-mono"
                        />
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
                      <p className="text-xs text-muted-foreground mt-2">
                        Share this ID with students to join the session
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleJoinSession} className="flex-1">
                        Join Session
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setSessionId(null)}
                      >
                        Create New
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <ManageAccessCodeCard />
          </TabsContent>

          <TabsContent value="share">
            <SendContentForm />
          </TabsContent>

          <TabsContent value="users">
            <ManageUsers />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

