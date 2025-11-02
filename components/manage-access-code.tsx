"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getAccessCode, updateAccessCode } from "@/app/actions";
import { toast } from "sonner";
import { Copy, Check } from "lucide-react";

export function ManageAccessCodeCard() {
  const [currentCode, setCurrentCode] = useState<string>("");
  const [newCode, setNewCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchCode = async () => {
      const code = await getAccessCode();
      setCurrentCode(code);
    };
    fetchCode();
  }, []);

  const handleUpdate = async () => {
    if (!newCode.trim()) {
      toast.error("Please enter a new access code");
      return;
    }

    setIsLoading(true);
    const result = await updateAccessCode(newCode);
    setIsLoading(false);

    if (result.success) {
      setCurrentCode(newCode);
      setNewCode("");
      toast.success("Access code updated successfully");
    } else {
      toast.error(result.error || "Failed to update access code");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      toast.success("Access code copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy access code");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Student Access Code</CardTitle>
        <CardDescription>
          Control the code students use to join sessions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">Current Code</p>
            <div className="flex items-center gap-2">
              <Input
                value={currentCode}
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
          </div>
        </div>
        <div>
          <p className="text-sm font-medium mb-1">New Code</p>
          <div className="flex items-center gap-2">
            <Input
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="Enter new access code"
              className="flex-1"
            />
            <Button
              onClick={handleUpdate}
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Update"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

