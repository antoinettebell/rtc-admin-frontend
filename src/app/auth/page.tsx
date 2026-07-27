"use client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { authApiService } from "@/services/auth-api-service";
import { toast } from "sonner";
import { ArrowRight, LoaderCircle, Lock, Mail, ShieldCheck } from "lucide-react";
import axios from "axios";

export default function Page() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const formSchema = z.object({
    email: z.string().email({ message: "Invalid email format." }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters." }),
  });

  type FormSchemaType = z.infer<typeof formSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = (data: FormSchemaType) => {
    const { email, password } = data;
    setIsLoading(true);
    authApiService
      .login(email, password)
      .then((res) => {
        const loginData = res.data?.data;

        if (!loginData?.user || !loginData?.authToken) {
          throw new Error(res.data?.message || "Login response is missing required fields.");
        }

        if (loginData.user.userType !== "SUPER_ADMIN") {
          toast.error("This account does not have admin portal access.");
          return;
        }

        localStorage.setItem("token", loginData.authToken);
        toast.success("Logged in successfully");
        window.location.assign("/");
      })
      .catch((error: any) => {
        console.error("Login failed:", error);

        if (axios.isAxiosError(error)) {
          const apiMessage =
            typeof error.response?.data?.message === "string"
              ? error.response.data.message
              : undefined;

          if (apiMessage) {
            toast.error(apiMessage);
            return;
          }

          if (!error.response) {
            toast.error("Unable to reach the admin API. Check the deployed API base URL.");
            return;
          }
        }

        toast.error("Login failed. Please try again.");
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <div className="min-h-svh w-full bg-background p-4 text-foreground md:p-8">
      <div className="mx-auto grid min-h-[calc(100svh-2rem)] w-full max-w-7xl overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl md:min-h-[calc(100svh-4rem)] lg:grid-cols-[0.72fr_1fr]">
        <aside className="relative hidden overflow-hidden bg-sidebar px-12 py-14 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between">
          <div className="absolute left-12 top-12 grid grid-cols-4 gap-4 opacity-80">
            {Array.from({ length: 16 }).map((_, index) => (
              <span
                key={index}
                className="h-1.5 w-1.5 rounded-full bg-sidebar-primary"
              />
            ))}
          </div>
          <div className="absolute -right-32 top-10 h-96 w-96 rounded-full bg-sidebar-primary/10" />
          <div className="absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-sidebar-primary/10" />

          <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center">
            <img
              src="/logo-tree.png"
              alt="Round Da' Corner ERP"
              className="mb-8 w-72 max-w-full drop-shadow-2xl"
            />
            <div className="font-serif text-[7rem] font-bold leading-none tracking-[0.12em] text-white drop-shadow-lg">
              RDC
            </div>
            <div className="mt-5 text-4xl font-semibold tracking-wide text-white">
              <span className="text-sidebar-primary">—</span> Round{" "}
              <span className="text-[#FF8A00]">Da’</span> Corner ERP{" "}
              <span className="text-sidebar-primary">—</span>
            </div>
            <div className="mt-8 h-px w-full bg-sidebar-primary/70" />
            <div className="mt-8 text-2xl tracking-[0.55em] text-sidebar-primary">
              ADMIN PORTAL
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-5 text-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-sidebar-primary text-sidebar-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <span>
              Secure. Reliable. <strong>Built for Growth.</strong>
            </span>
          </div>

          <div className="absolute bottom-12 right-12 grid grid-cols-6 gap-4 opacity-80">
            {Array.from({ length: 24 }).map((_, index) => (
              <span
                key={index}
                className="h-1.5 w-1.5 rounded-full bg-sidebar-primary"
              />
            ))}
          </div>
        </aside>

        <main className="flex items-center justify-center px-6 py-12 md:px-12">
          <div className="w-full max-w-2xl">
            <div className="mb-12 flex flex-col items-center text-center">
              <div className="mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-secondary shadow-lg shadow-primary/5">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-card text-sidebar-primary">
                  <ShieldCheck className="h-12 w-12" />
                </div>
              </div>
              <h1 className="text-5xl font-bold tracking-tight text-foreground">
                Welcome Back
              </h1>
              <p className="mt-6 text-xl text-muted-foreground">
                Sign in to your Round Da’ Corner ERP admin account
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid gap-3">
                <Label htmlFor="email" className="text-base font-bold">
                  Email Address
                </Label>
                <div className="relative">
                  <div className="pointer-events-none absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Mail className="h-5 w-5" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    error={errors.email?.message}
                    className="h-16 rounded-lg pl-20 text-lg shadow-sm md:text-lg"
                    {...register("email")}
                  />
                </div>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="password" className="text-base font-bold">
                  Password
                </Label>
                <div className="relative">
                  <div className="pointer-events-none absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Lock className="h-5 w-5" />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    error={errors.password?.message}
                    className="h-16 rounded-lg pl-20 pr-14 text-lg shadow-sm md:text-lg"
                    {...register("password")}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/auth/forgot-password")}
                  className="ml-auto text-base font-medium text-sidebar-primary hover:underline"
                >
                  Forgot your password?
                </button>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                variant="default"
                className="h-16 w-full rounded-lg bg-sidebar text-xl font-bold text-sidebar-foreground hover:bg-sidebar/90"
              >
                Sign In
                {isLoading ? (
                  <LoaderCircle className="ml-3 h-6 w-6 animate-spin" />
                ) : (
                  <ArrowRight className="ml-3 h-6 w-6" />
                )}
              </Button>
            </form>

            <div className="my-12 flex items-center gap-8">
              <div className="h-px flex-1 bg-border" />
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Lock className="h-4 w-4" />
              </div>
              <div className="h-px flex-1 bg-border" />
            </div>

            <p className="text-center text-base text-muted-foreground">
              © 2025 Round Da’ Corner ERP. All rights reserved.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
