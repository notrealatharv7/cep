"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Loader2, Trash2, Users, UserX, AlertTriangle } from "lucide-react";

export function ManageUsers() {
  const [action, setAction] = useState<"all" | "byRole" | "byName">("all");
  const [role, setRole] = useState<"teacher" | "student">("student");
  const [userName, setUserName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmText, setConfirmText] = useState<string>("");

  const handleRemove = async () => {
    if (!confirmDelete) {
      toast.error("Please confirm the action by typing 'DELETE'");
      return;
    }

    if (confirmText !== "DELETE") {
      toast.error("Confirmation text must be exactly 'DELETE'");
      return;
    }

    setIsLoading(true);

    try {
      let url = `/api/admin/remove-users`;
      
      const body: any = { action };

      if (action === "byRole") {
        body.role = role;
      } else if (action === "byName") {
        if (!userName.trim()) {
          toast.error("Please enter a user name");
          setIsLoading(false);
          return;
        }
        body.userName = userName.trim();
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Successfully removed ${result.deletedCount || 0} user(s)`);
        setConfirmDelete(false);
        setConfirmText("");
        setUserName("");
      } else {
        toast.error(result.error || "Failed to remove users");
      }
    } catch (error: any) {
      console.error("Error removing users:", error);
      toast.error("Failed to remove users");
    } finally {
      setIsLoading(false);
    }
  };

  const getActionDescription = () => {
    switch (action) {
      case "all":
        return "This will remove ALL users (both teachers and students) from the database.";
      case "byRole":
        return `This will remove ALL ${role}s from the database.`;
      case "byName":
        return `This will remove the user "${userName || "(enter name)"}" from the database.`;
      default:
        return "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Manage Users
        </CardTitle>
        <CardDescription>
          Remove users from the database. This action cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> Removing users is permanent and cannot be undone.
            Users will lose all their points and data.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <Label>Action</Label>
            <div className="flex gap-2 mt-2">
              <Button
                variant={action === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setAction("all");
                  setConfirmDelete(false);
                  setConfirmText("");
                }}
              >
                Remove All Users
              </Button>
              <Button
                variant={action === "byRole" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setAction("byRole");
                  setConfirmDelete(false);
                  setConfirmText("");
                }}
              >
                Remove by Role
              </Button>
              <Button
                variant={action === "byName" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setAction("byName");
                  setConfirmDelete(false);
                  setConfirmText("");
                }}
              >
                Remove Specific User
              </Button>
            </div>
          </div>

          {action === "byRole" && (
            <div>
              <Label>Role</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={role === "teacher" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRole("teacher")}
                >
                  Teachers
                </Button>
                <Button
                  variant={role === "student" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRole("student")}
                >
                  Students
                </Button>
              </div>
            </div>
          )}

          {action === "byName" && (
            <div>
              <Label htmlFor="userName">User Name</Label>
              <Input
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter user name to remove"
                className="mt-2"
              />
            </div>
          )}

          <div>
            <p className="text-sm text-muted-foreground mb-2">
              {getActionDescription()}
            </p>
          </div>

          {!confirmDelete ? (
            <Button
              variant="destructive"
              onClick={() => setConfirmDelete(true)}
              className="w-full"
            >
              <UserX className="mr-2 h-4 w-4" />
              Proceed with Removal
            </Button>
          ) : (
            <div className="space-y-3 p-4 border border-destructive rounded-lg bg-destructive/5">
              <div>
                <Label htmlFor="confirmText">
                  Type <strong>DELETE</strong> to confirm:
                </Label>
                <Input
                  id="confirmText"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="mt-2 font-mono"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={handleRemove}
                  disabled={isLoading || confirmText !== "DELETE"}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Confirm Removal
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setConfirmDelete(false);
                    setConfirmText("");
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground pt-2 border-t">
          <p>
            <strong>Note:</strong> This feature is only available to teachers. 
            Users will be permanently removed from the database.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

