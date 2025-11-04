import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { firebaseConfig } from "./config";

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

function missingFirebaseKeys(): string[] {
  const missing: string[] = [];
  if (!firebaseConfig?.apiKey) missing.push("NEXT_PUBLIC_FIREBASE_API_KEY");
  if (!firebaseConfig?.authDomain) missing.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
  if (!firebaseConfig?.projectId) missing.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  if (!firebaseConfig?.appId) missing.push("NEXT_PUBLIC_FIREBASE_APP_ID");
  return missing;
}
function hasFirebaseConfig(): boolean {
  return missingFirebaseKeys().length === 0;
}

// Singleton pattern to prevent multiple initializations
if (typeof window !== "undefined") {
  // Client-side initialization
  if (hasFirebaseConfig()) {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
    } else {
      app = getApps()[0];
      auth = getAuth(app);
    }
  } else {
    // Missing Firebase env; continue without Auth.
    app = undefined;
    auth = undefined;
    if (process.env.NODE_ENV !== "production") {
      const missing = missingFirebaseKeys();
      // eslint-disable-next-line no-console
      console.warn(
        "Firebase config is missing; teacher sign-in is disabled. Missing keys:",
        missing.join(", ") || "unknown"
      );
    }
  }
} else {
  // Server-side initialization (for Server Actions)
  if (hasFirebaseConfig()) {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
  } else {
    app = undefined;
  }
  // Note: auth is only available client-side
  auth = undefined;
}

export { app, auth };

