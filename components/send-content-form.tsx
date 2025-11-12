"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { sendContent } from "@/app/actions";
import { toast } from "sonner";
import { Copy, Check, Loader2 } from "lucide-react";

export function SendContentForm() {
  const [text, setText] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const programmingLanguages = [
    { value: "", label: "Plain Text" },
    { value: "c", label: "C" },
    { value: "cpp", label: "C++" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "javascript", label: "JavaScript" },
    { value: "typescript", label: "TypeScript" },
    { value: "html", label: "HTML" },
    { value: "css", label: "CSS" },
    { value: "json", label: "JSON" },
    { value: "xml", label: "XML" },
    { value: "sql", label: "SQL" },
    { value: "bash", label: "Bash/Shell" },
    { value: "php", label: "PHP" },
    { value: "ruby", label: "Ruby" },
    { value: "go", label: "Go" },
    { value: "rust", label: "Rust" },
    { value: "swift", label: "Swift" },
    { value: "kotlin", label: "Kotlin" },
    { value: "dart", label: "Dart" },
  ];

  const handleSend = async () => {
    if (!text.trim() && !file) {
      toast.error("Please enter text or select a file");
      return;
    }

    const userName = sessionStorage.getItem("userName");
    if (!userName) {
      toast.error("You must be logged in to share content");
      return;
    }

    setIsLoading(true);

    try {
      if (file) {
        // Convert file to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Content = reader.result as string;
          const result = await sendContent(
            "file",
            base64Content,
            userName,
            file.name,
            file.type
          );

          setIsLoading(false);

          if (result.success && result.contentId) {
            setShareCode(result.contentId);
            setText("");
            setFile(null);
            toast.success("Content shared successfully!");
          } else {
            toast.error(result.error || "Failed to share content");
          }
        };
        reader.readAsDataURL(file);
      } else {
        // Send text
        const result = await sendContent("text", text, userName, undefined, undefined, language || undefined);
        setIsLoading(false);

        if (result.success && result.contentId) {
          setShareCode(result.contentId);
          setText("");
          setLanguage("");
          toast.success("Content shared successfully!");
        } else {
          toast.error(result.error || "Failed to share content");
        }
      }
    } catch (error) {
      setIsLoading(false);
      toast.error("Failed to share content");
    }
  };

  const handleCopy = async () => {
    if (!shareCode) return;

    try {
      await navigator.clipboard.writeText(shareCode);
      setCopied(true);
      toast.success("Share code copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy share code");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Share Content</CardTitle>
        <CardDescription>
          Share text or files with a one-time code
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!shareCode ? (
          <>
            <div>
              <label className="text-sm font-medium mb-1 block">Text</label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text to share..."
                rows={6}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Language (for code)</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {programmingLanguages.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Select the programming language if sharing code
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">File (optional)</label>
              <Input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sharing...
                </>
              ) : (
                "Get Share Code"
              )}
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Share Code</p>
              <div className="flex items-center gap-2">
                <Input
                  value={shareCode}
                  readOnly
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Share this code with others to receive the content
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setShareCode(null);
                setText("");
                setFile(null);
                setLanguage("");
              }}
              className="w-full"
            >
              Share New Content
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

