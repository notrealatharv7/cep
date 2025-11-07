"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authenticateWithCode, upsertTeacher } from "@/app/actions";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/firebase/index";
import { toast } from "sonner";
import { Loader2, GraduationCap, User, Sparkles } from "lucide-react";
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

      await upsertTeacher(
        user.displayName || user.email || "Teacher",
        user.email || undefined,
        user.uid
      );

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Collab Notes
            </h1>
            <p className="text-muted-foreground text-lg">
              Collaborative learning made simple
            </p>
          </div>
          
          <Card className="border-2 shadow-xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl">Get Started</CardTitle>
              <CardDescription className="text-base">
                Choose your role to continue
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={role === "teacher" ? "default" : "outline"}
                  size="lg"
                  className={`h-24 flex flex-col items-center justify-center gap-2 transition-all ${
                    role === "teacher"
                      ? "bg-primary text-primary-foreground shadow-md scale-105"
                      : "hover:scale-105 hover:border-primary/50"
                  }`}
                  onClick={() => {
                    setRole("teacher");
                    setError("");
                  }}
                >
                  <GraduationCap className="h-6 w-6" />
                  <span className="font-semibold">Teacher</span>
                </Button>
                <Button
                  variant={role === "student" ? "default" : "outline"}
                  size="lg"
                  className={`h-24 flex flex-col items-center justify-center gap-2 transition-all ${
                    role === "student"
                      ? "bg-primary text-primary-foreground shadow-md scale-105"
                      : "hover:scale-105 hover:border-primary/50"
                  }`}
                  onClick={() => {
                    setRole("student");
                    setError("");
                  }}
                >
                  <User className="h-6 w-6" />
                  <span className="font-semibold">Student</span>
                </Button>
              </div>

              {role === "teacher" && (
                <div className="space-y-4 pt-2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg blur-xl"></div>
                    <Button
                      onClick={handleTeacherSignIn}
                      disabled={isLoading}
                      variant="outline"
                      className="w-full relative bg-background hover:bg-muted border-2 border-primary/20 hover:border-primary/40 transition-all text-foreground"
                      size="lg"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          <svg
                            className="mr-2 h-5 w-5"
                            viewBox="0 0 24 24"
                          >
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                          </svg>
                          <span className="font-semibold text-foreground">Sign in with Google</span>
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    Secure authentication with Google
                  </p>
                </div>
              )}

              {role === "student" && (
                <div className="space-y-5 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold">
                      Your Name
                    </Label>
                    <Input
                      id="name"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="Enter your name"
                      className="h-11 text-base"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleStudentLogin();
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-sm font-semibold">
                      Access Code
                    </Label>
                    <Input
                      id="code"
                      value={studentCode}
                      onChange={(e) => setStudentCode(e.target.value)}
                      placeholder="Enter access code"
                      className="h-11 text-base font-mono"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleStudentLogin();
                        }
                      }}
                    />
                  </div>
                  <Button
                    onClick={handleStudentLogin}
                    disabled={isLoading || !studentName.trim() || !studentCode.trim()}
                    className="w-full bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      <>
                        <span className="font-semibold">Continue</span>
                      </>
                    )}
                  </Button>
                </div>
              )}

              {error && (
                <Alert variant="destructive" className="mt-4 animate-in slide-in-from-top-2">
                  <AlertDescription className="font-medium">{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
