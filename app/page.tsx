"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authenticateWithCode } from "@/app/actions";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "@/firebase/index";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Header } from "@/components/header";

export default function Home() {
  const router = useRouter();
  const [role, setRole] = useState<"teacher" | "student" | null>(null);
  const [studentName, setStudentName] = useState<string>("");
  const [studentCode, setStudentCode] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if already logged in
    const userName = sessionStorage.getItem("userName");
    const userRole = sessionStorage.getItem("userRole");

    if (userName && userRole) {
      if (userRole === "teacher") {
        router.push("/collab");
      } else {
        router.push("/join");
      }
    }
  }, [router]);

  const handleTeacherSignIn = async () => {
    if (typeof window === "undefined" || !auth) {
      toast.error("Firebase not initialized");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Store user in Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          name: user.displayName || user.email || "Teacher",
          role: "teacher",
          points: 0,
          createdAt: new Date().toISOString(),
          email: user.email,
        });
      }

      // Store in sessionStorage
      sessionStorage.setItem("userName", user.displayName || user.email || "Teacher");
      sessionStorage.setItem("userRole", "teacher");

      toast.success("Signed in successfully!");
      router.push("/collab");
    } catch (error: any) {
      console.error("Error signing in:", error);
      setError(error.message || "Failed to sign in with Google");
      toast.error("Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentLogin = async () => {
    if (!studentName.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!studentCode.trim()) {
      setError("Please enter the access code");
      return;
    }

    setIsLoading(true);
    setError("");

    const result = await authenticateWithCode(studentCode.trim(), studentName.trim());

    if (result.success) {
      sessionStorage.setItem("userName", studentName.trim());
      sessionStorage.setItem("userRole", "student");
      toast.success("Logged in successfully!");
      router.push("/join");
    } else {
      setError(result.error || "Invalid access code");
      toast.error(result.error || "Login failed");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Welcome to Collab Notes</CardTitle>
              <CardDescription>
                Sign in as a teacher or student to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup
                value={role || ""}
                onValueChange={(value) => {
                  setRole(value as "teacher" | "student");
                  setError("");
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="teacher" id="teacher" />
                  <Label htmlFor="teacher" className="cursor-pointer">
                    Teacher
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="student" id="student" />
                  <Label htmlFor="student" className="cursor-pointer">
                    Student
                  </Label>
                </div>
              </RadioGroup>

              {role === "teacher" && (
                <div className="space-y-4">
                  <Button
                    onClick={handleTeacherSignIn}
                    disabled={isLoading}
                    className="w-full"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <svg
                          className="mr-2 h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Sign in with Google
                      </>
                    )}
                  </Button>
                </div>
              )}

              {role === "student" && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Your Name</Label>
                    <Input
                      id="name"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="Enter your name"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleStudentLogin();
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="code">Access Code</Label>
                    <Input
                      id="code"
                      value={studentCode}
                      onChange={(e) => setStudentCode(e.target.value)}
                      placeholder="Enter access code"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleStudentLogin();
                        }
                      }}
                    />
                  </div>
                  <Button
                    onClick={handleStudentLogin}
                    disabled={isLoading}
                    className="w-full"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      "Continue"
                    )}
                  </Button>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
