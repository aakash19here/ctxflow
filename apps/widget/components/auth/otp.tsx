"use client";

import { authClient } from "@repo/auth/client";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { cn } from "@repo/ui/lib/utils";
import {
  Mail,
  MailCheck,
  ShieldAlert,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

export default function OtpAuth() {
  const [email, setEmail] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [signUpDisabled, setSignUpDisabled] = useState(false);

  function handleReset() {
    setEmail("");
    setIsSent(false);
    setSignUpDisabled(false);
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    setIsLoading(true);
    e.preventDefault();
    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      });

      if (error) {
        toast.error("Sign up is temporarily disabled. Try again later.");
      } else {
        setIsSent(true);
        toast.success(`OTP sent to ${email}`);
      }
    } catch (e) {
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6")}>
      {isSent ? (
        <OtpInput email={email} />
      ) : (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="mx-auto">
              <Sparkles />
            </CardTitle>
            <CardDescription className="text-foreground">
              Sign in with OTP
            </CardDescription>
            <CardDescription>
              No password needed, just use your email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6">
                <div className="flex flex-col gap-4"></div>
                <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t"></div>
                <div className="grid gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? "Sending..." : "Send"} an OTP{" "}
                    <Mail className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground mx-auto">
            We'll send a secure one time password to your email that will sign
            you in instantly.
          </CardFooter>
        </Card>
      )}

      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}

function OtpInput({ email }: { email: string }) {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!otp) {
      toast.error("Please enter the OTP");
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await authClient.signIn.emailOtp({
        email,
        otp: otp,
      });
      if (error) {
        toast.error("Invalid OTP");
      } else {
        toast.success("OTP verified");
        router.push("/chat");
      }
    } catch (e) {
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="mx-auto">
          <MailCheck />
        </CardTitle>
        <CardDescription className="text-foreground">
          Enter the code sent to your email
        </CardDescription>
        <CardDescription></CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            <div className="flex flex-col gap-4"></div>
            <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t"></div>
            <div className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="otp">OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  required
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Verifying..." : "Verify"}
                <WandSparkles className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
