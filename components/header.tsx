"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getUserPoints } from "@/app/actions";
import { signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "@/firebase/index";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [points, setPoints] = useState<number>(0);

  useEffect(() => {
    // Get user info from sessionStorage
    const name = sessionStorage.getItem("userName");
    const role = sessionStorage.getItem("userRole");

    setUserName(name);
    setUserRole(role);

    // Poll for points every 5 seconds
    if (name) {
      const fetchPoints = async () => {
        const result = await getUserPoints(name);
        if (result.success && result.points !== undefined) {
          setPoints(result.points);
        }
      };

      fetchPoints();
      const interval = setInterval(fetchPoints, 5000);

      return () => clearInterval(interval);
    }
  }, [pathname]);

  const handleSignOut = async () => {
    try {
      // If teacher, sign out from Firebase
      if (userRole === "teacher" && auth) {
        await firebaseSignOut(auth);
      }

      // Clear session storage
      sessionStorage.removeItem("userName");
      sessionStorage.removeItem("userRole");

      // Redirect to home
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (!userName) {
    return (
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Collab Notes</h1>
          <Link href="/leaderboard">
            <Button variant="ghost">Leaderboard</Button>
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Collab Notes</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {userName} ({userRole})
          </span>
          <span className="text-sm font-semibold">⭐ {points} pts</span>
          <Link href="/leaderboard">
            <Button variant="ghost">Leaderboard</Button>
          </Link>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
}

