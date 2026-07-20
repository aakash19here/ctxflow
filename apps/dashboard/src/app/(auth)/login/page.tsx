"use client";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { useState } from "react";

const isProduction = process.env.NODE_ENV === "production";

export default function LoginPage() {
  const [showSignIn, setShowSignIn] = useState(isProduction);

  if (isProduction) {
    return <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />;
  }

  return showSignIn ? (
    <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
  ) : (
    <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
  );
}
