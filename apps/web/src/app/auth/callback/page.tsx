"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The backend redirects directly to /dashboard after GitHub OAuth.
// This page handles any leftover redirects or error states.
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");

    if (error) {
      router.replace(`/?error=${error}`);
    } else {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
