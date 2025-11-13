"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { userApiService } from "@/services/user-api-service";
import { toast } from "sonner";
import { LoadingButton } from "@/components/loading-button";

export default function Page() {
  const router = useRouter();
  const searchParams =  useSearchParams();
  const token = searchParams.get("token");

  const [loadingPassword, setLoadingPassword] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [passwordReset, setPasswordReset] = useState(false);

  const passwordFormSchema = z
    .object({
      password: z.string().min(8, "Password must be at least 8 characters"),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    });

  const {
    register: passwordRegister,
    handleSubmit: handleSubmitPassword,
    formState: formStatePassword,
  } = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    mode: "onChange",
  });

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      return;
    }
    userApiService
      .checkToken({ token })
      .then((res) => {
        console.log(res)
        setTokenValid(true);
      })
      .catch(() => {
        setTokenValid(false);
      });
  }, [token]);

  const onSubmitPassword = (data: z.infer<typeof passwordFormSchema>) => {
    setLoadingPassword(true);

    if (!token) {
      toast.error("Invalid or missing token.");
      return;
    }

    userApiService
      .changePassword({
        password: data.password,
        token,
      })
      .then((res) => {
        toast.success(res.data?.message || "Password updated successfully.");
        setPasswordReset(true); // hide form and show success message
      })
      .catch((e) => {
        const errorMsg = e.response?.data?.message || "Something went wrong";
        toast.error(errorMsg);
      })
      .finally(() => {
        setLoadingPassword(false);
      });
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className={cn("flex flex-col gap-6")}>
          <Card className="overflow-hidden rounded-md">
            <CardHeader className="p-0">
              <CardTitle className="text-2xl px-6 pt-9 pb-5 rounded-b-3xl bg-primary flex justify-center text-white">
                Reset Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center p-4">
                <img src="/logo-tree.png" className="w-[120px]" />
              </div>

              {/* ✅ link not checked yet */}
              {tokenValid === null && (
                <div className="text-center text-gray-600">Verifying whether the link is valid or not...</div>
              )}

              {/* ✅ link invalid */}
              {tokenValid === false && (
                <div className="text-center text-red-500 font-medium">
                  The link is invalid or has expired.
                </div>
              )}

              {/* ✅ Password reset success */}
              {passwordReset && (
                <div className="text-center text-green-600 font-medium">
                🎉 Your password has been reset successfully! You can now log in to your account.
              </div>
              )}

              {/* ✅ Token valid → show form (only if password not reset yet) */}
              {tokenValid === true && !passwordReset && (
                <form onSubmit={handleSubmitPassword(onSubmitPassword)}>
                  <div className="flex flex-col gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="password">New Password</Label>
                      <Input
                        type="password"
                        required
                        {...passwordRegister("password")}
                        placeholder="New Password"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        type="password"
                        required
                        {...passwordRegister("confirmPassword")}
                        placeholder="Confirm Password"
                      />
                    </div>
                    <LoadingButton
                      isLoading={loadingPassword}
                      disabled={!formStatePassword.isValid || loadingPassword}
                      type="submit"
                    >
                      Reset Password
                    </LoadingButton>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
