"use client";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { LoaderCircle } from "lucide-react";

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
    getValues: getFormValue,
  } = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = (data: FormSchemaType) => {
    const { email, password } = data;
    setIsLoading(true);
    authApiService
      .login(email, password)
      .then((res) => {
        if (res.data.data.user.userType !== "SUPER_ADMIN") {
          toast.error("Invalid credentials");
          return;
        }

        if (res.data.data.authToken) {
          localStorage.setItem("token", res.data.data.authToken);
          toast.success("Logged in successfully");
          router.replace("/");
        }
      })
      .catch(() => {
        toast.error("Invalid credentials");
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className={cn("flex flex-col gap-6")}>
          <Card className="overflow-hidden rounded-md">
            <CardHeader className="p-0">
              <CardTitle className="text-2xl px-6 pt-9 pb-5 rounded-b-3xl bg-primary flex justify-center">
                <svg
                  width="69"
                  height="15"
                  viewBox="0 0 69 15"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11.9964 2.55068H3.89643C3.52309 2.55068 3.19643 2.64402 2.91643 2.83068C2.59643 3.04401 2.43643 3.33068 2.43643 3.69068C2.43643 4.35735 2.96976 4.69068 4.03643 4.69068H10.1964C10.7298 4.69068 11.0298 4.69735 11.0964 4.71068C11.5364 4.75068 11.7564 4.87735 11.7564 5.09068C11.7564 5.25068 11.7498 5.36402 11.7364 5.43068C11.1231 7.69735 9.64976 9.76402 7.31643 11.6307C5.03643 13.444 2.70309 14.4773 0.316426 14.7307V12.5507C1.15643 12.5507 2.10976 12.2907 3.17643 11.7707C4.06976 11.3573 5.14976 10.644 6.41643 9.63068C7.96309 8.41735 8.73643 7.51068 8.73643 6.91068C8.73643 6.83068 8.68976 6.75735 8.59643 6.69068L4.89643 6.71068C3.50976 6.71068 2.47643 6.55068 1.79643 6.23068C0.80976 5.76402 0.316426 4.91068 0.316426 3.67068C0.316426 2.83068 0.636426 2.08401 1.27643 1.43068C1.91643 0.764015 2.66309 0.430682 3.51643 0.430682H11.9964V2.55068ZM15.8729 14.7307H13.7329V0.430682H15.8729V14.7307ZM29.0146 8.83068V14.7307H17.3946C17.728 11.584 18.988 8.67068 21.1746 5.99068C23.3746 3.29735 25.9813 1.45068 28.9946 0.450681V2.67068C26.7013 3.68402 24.8213 5.00402 23.3546 6.63068C21.9413 8.21735 20.8013 10.2107 19.9346 12.6107H26.9146V8.83068H29.0146ZM42.8325 14.7307H40.6925C39.9325 12.344 39.0058 10.324 37.9125 8.67068C36.6992 6.85735 35.1458 5.26402 33.2525 3.89068V14.7307H31.1525V0.450681C33.0325 0.997348 34.8592 2.09068 36.6325 3.73068C38.2192 5.17068 39.5658 6.84402 40.6725 8.75068V0.430682H42.8325V14.7307ZM54.6574 14.7307H52.5174V0.430682H54.6574V14.7307ZM68.6592 14.7307H66.5192C65.7592 12.344 64.8325 10.324 63.7392 8.67068C62.5259 6.85735 60.9725 5.26402 59.0792 3.89068V14.7307H56.9792V0.450681C58.8592 0.997348 60.6859 2.09068 62.4592 3.73068C64.0459 5.17068 65.3925 6.84402 66.4992 8.75068V0.430682H68.6592V14.7307N"
                  fill="white"
                />
                </svg>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center p-4">
                <img src="/logo-tree.png" className="w-[120px]" />
              </div>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      error={errors.email?.message}
                      {...register("email")}
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center">
                      <Label htmlFor="password">Password</Label>
                    </div>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      error={errors.password?.message}
                      {...register("password")}
                    />
                    {/*<div className="flex justify-end items-center">*/}
                    {/*  <a*/}
                    {/*    onClick={() => router.push("/auth/forgot-password")}*/}
                    {/*    className="ml-auto inline-block text-sm underline-offset-4 hover:underline cursor-pointer"*/}
                    {/*  >*/}
                    {/*    Forgot your password?*/}
                    {/*  </a>*/}
                    {/*</div>*/}
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    variant="default"
                    className="w-full"
                  >
                    Login
                    {isLoading && <LoaderCircle className="animate-spin" />}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}