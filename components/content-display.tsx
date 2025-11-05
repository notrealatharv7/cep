"use client";

import { useEffect, useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { updateContent } from "@/app/actions";
import { SharedContent } from "@/app/actions";
import { Download } from "lucide-react";

interface ContentDisplayProps {
  content: SharedContent | null;
  sessionId: string;
  isTeacher: boolean;
  onRewardSender?: () => void;
}

export function ContentDisplay({
  content,
  sessionId,
  isTeacher,
  onRewardSender,
}: ContentDisplayProps) {
  const [text, setText] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (content?.type !== "text") return;
    // For students, always reflect latest content from server
    if (!isTeacher) {
      setText(content.content || "");
      return;
    }
    // For teachers, avoid overwriting local typing to prevent cursor jumps.
    // Only update if server differs AND we are not currently saving (debounce period finished)
    const incoming = content.content || "";
    if (!isSaving && incoming !== text) {
      setText(incoming);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, isTeacher, isSaving]);

  const handleTextChange = (newText: string) => {
    if (!isTeacher) return;

    setText(newText);

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer for debounced save
    debounceTimer.current = setTimeout(async () => {
      setIsSaving(true);
      await updateContent(sessionId, newText);
      setIsSaving(false);
    }, 1000);
  };

  const handleDownload = () => {
    if (!content || content.type !== "file" || !content.content) return;

    try {
      // Create a blob from base64
      const byteCharacters = atob(content.content.split(",")[1] || content.content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: content.mimetype || "application/octet-stream" });

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = content.filename || "download";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  if (!content) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">No content available</p>
        </CardContent>
      </Card>
    );
  }

  if (content.type === "file") {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">File shared by:</p>
            <p className="font-medium">{content.senderName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Filename:</p>
            <p className="font-medium">{content.filename || "Unknown"}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            {onRewardSender && (
              <Button variant="outline" onClick={onRewardSender}>
                ⭐ Reward Sender
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {!isTeacher && (
            <div>
              <p className="text-sm text-muted-foreground">Shared by:</p>
              <p className="font-medium">{content.senderName}</p>
            </div>
          )}
          <Textarea
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            readOnly={!isTeacher}
            placeholder={isTeacher ? "Start typing..." : "Content will appear here..."}
            rows={15}
            className="font-mono text-sm"
          />
          {isTeacher && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isSaving && <span>Auto-saving...</span>}
            </div>
          )}
          {onRewardSender && !isTeacher && (
            <Button variant="outline" onClick={onRewardSender}>
              ⭐ Reward Sender
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

