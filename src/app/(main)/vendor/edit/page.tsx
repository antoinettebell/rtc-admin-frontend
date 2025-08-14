"use client";
import { ArrowLeft, SquareUserRound } from "lucide-react";
import * as React from "react";
import { useState } from "react";
import { userApiService } from "@/services/user-api-service";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Status } from "@/components/ui/status";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as z from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoadingButton } from "@/components/loading-button";
import { PhoneInput } from "@/components/phone-input";
import { toast } from "sonner";
import { foodTruckApiService } from "@/services/food-truck-api-service";
import { StringHelper } from "@/models/string-helper-model";

export default function VendorDetail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("q");
  const p = searchParams.get("p") || "";
  const l = searchParams.get("l") || "";

  const [planColor, setPlanColor] = useState<string>("");
  const [vendorLoading, setVendorLoading] = useState<boolean>(false);
  const [loadingFT, setLoadingFT] = useState<boolean>(false);
  const [loadingPassword, setLoadingPassword] = useState<boolean>(false);

  if (!id) {
    return 404;
  }

  const goBackWithListState = () => {
    const params = new URLSearchParams();
    if (p) params.set("p", p);
    if (l) params.set("l", l);
    const qs = params.toString();
    router.replace(qs ? `/vendor?${qs}` : "/vendor");
  };

  const vendorFormSchema = z.object({
    email: z.string().email({ message: "Invalid email format." }),
    phone: z.string().min(8),
    firstName: z.string().min(2),
  });

  const ftFormSchema = z.object({
    name: z.string().min(2),
    infoType: z.string().min(1),
  });

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
    register: vendorRegister,
    handleSubmit: handleVendorSubmit,
    formState: formStateVendor,
    getValues: getVendorValue,
    reset: setVendorValue,
    control: vendorControl,
  } = useForm<z.infer<typeof vendorFormSchema>>({
    resolver: zodResolver(vendorFormSchema),
  });

  const {
    register: ftRegister,
    handleSubmit: handleSubmitFT,
    formState: formStateFT,
    getValues: getValueFT,
    reset: setValueFT,
  } = useForm<z.infer<typeof ftFormSchema>>({
    resolver: zodResolver(ftFormSchema),
  });

  const {
    register: passwordRegister,
    handleSubmit: handleSubmitPassword,
    formState: formStatePassword,
    getValues: getValuePassword,
  } = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
  });

  const onVendorSubmit = (data: z.infer<typeof vendorFormSchema>) => {
    const { firstName, phone } = data;
    const p = StringHelper.getPhoneCodeAndNumber(phone);
    setVendorLoading(true);
    userApiService
      .update(id?.toString(), {
        firstName,
        countryCode: p.countryCode,
        mobileNumber: p.mobileNumber,
      })
      .then((res) => {
        toast.success("Vendor details updated.");
      })
      .catch((e) => {
        console.log(e);
        toast.error("Something went wrong");
      })
      .finally(() => {
        setVendorLoading(false);
      });
  };

  const onSubmitFT = (data: z.infer<typeof ftFormSchema>) => {
    if (!result?.user?.foodTruck?._id) return;
    const { name, infoType } = data;
    setLoadingFT(true);
    foodTruckApiService
      .update(result?.user?.foodTruck?._id?.toString(), { name, infoType })
      .then((res) => {
        toast.success("Food truck details updated.");
      })
      .catch((e) => {
        console.log(e);
        toast.error("Something went wrong");
      })
      .finally(() => {
        setLoadingFT(false);
      });
  };

  const onSubmitPassword = (data: z.infer<typeof passwordFormSchema>) => {
    const { password, confirmPassword } = data;
    setLoadingPassword(true);
    userApiService
      .update(id?.toString(), { password })
      .then((res) => {
        toast.success("Password updated.");
      })
      .catch((e) => {
        console.log(e);
        toast.error("Something went wrong");
      })
      .finally(() => {
        setVendorLoading(false);
      });
  };

  const {
    data: result,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["vendor-detail"],
    queryFn: () =>
      Promise.all([
        userApiService.getById(id?.toString() || ""),
        // categoryApiService.list("", 1, 100, { userId: id?.toString() }),
        // menuApiService.list("", 1, 100, { userId: id?.toString() }),
      ]).then(([userRes, categoryRes, menuRes]) => {
        if (userRes.data?.data.user.foodTruck?.plan) {
          setPlanColor(
            userRes.data?.data.user.foodTruck?.plan?.titleColor || "",
          );
        }
        console.log("==========userRes?.data?.data", userRes?.data?.data);

        setVendorValue({
          email: userRes?.data?.data?.user?.email,
          phone:
            (userRes?.data?.data?.user?.countryCode
              ? `${userRes?.data?.data?.user?.countryCode}`
              : "") + userRes?.data?.data?.user?.mobileNumber,
          firstName: userRes?.data?.data?.user?.firstName,
        });

        setValueFT({
          name: userRes?.data?.data?.user?.foodTruck?.name,
          infoType: userRes?.data?.data?.user?.foodTruck?.infoType,
        });
        return {
          ...(userRes?.data.data || {}),
          // categoryList: categoryRes.data.data.records,
          // menuList: menuRes.data.data.records,
        };
      }),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  return (
    <>
      <div className="flex justify-between flex-wrap mb-2">
        <div className="font-semibold text-[28px] leading-[42px] mb-2 flex gap-3 items-center">
          <Button variant="outline" onClick={() => goBackWithListState()}>
            <ArrowLeft /> Back
          </Button>
          Edit Vendor Detail
        </div>
      </div>

      {isFetching && (
        <div>
          <Skeleton className="w-[350px] h-5 mb-2" />
          <Skeleton className="w-[190px] h-[250px] mb-2" />
          <Skeleton className="h-4 mb-2" />
          <Skeleton className="h-4 mb-2" />
          <Skeleton className="h-4 mb-2" />
        </div>
      )}

      {!!result?.user && !isFetching && (
        <>
          <div className="flex flex-wrap gap-4 mb-4">
            <div
              className="border w-fit rounded-xl p-1"
              style={
                planColor
                  ? {
                      background: planColor,
                    }
                  : {}
              }
            >
              <div className="px-2 py-1 text-base font-bold text-white">
                {result?.user.foodTruck?.plan?.name}
              </div>
              <div className="p-2 rounded-md w-fit min-w-[350px] bg-white">
                <div className="flex gap-3">
                  <div className="border rounded p-2 h-fit">
                    <SquareUserRound size={30} />
                  </div>
                  <div className="w-full">
                    <h3 className="font-medium leading-none mt-1 mb-1 w-auto">
                      Vendor:{" "}
                      <b>
                        {`${result?.user.firstName} ${result?.user.lastName || ""}`.trim()}
                      </b>
                    </h3>
                    <p className="text-sm text-muted-foreground mb-1">
                      Detail: <b>{result.user.foodTruck?.name}</b>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Type:{" "}
                      <b className="capitalize">
                        {result.user.foodTruck?.infoType || "-"}
                      </b>
                    </p>
                  </div>
                </div>
                <div className="flex justify-end w-full mt-2">
                  <Status
                    status={result?.user.requestStatus}
                    className="!py-1.5"
                  />
                </div>
              </div>
            </div>
            {result?.user?.requestStatus === "REJECTED" &&
              result?.user?.reasonForRejection?.trim()?.length && (
                <div className="p-3 rounded-md bg-red-100 border border-red-200 h-fit w-fit max-w-full">
                  <div className="text-base font-semibold text-red-700 mb-2">
                    Reason for the Rejection:
                  </div>
                  <div className="text-sm text-red-800">
                    {result?.user.reasonForRejection || "-"}
                  </div>
                </div>
              )}
          </div>

          <div className="border rounded-xl p-4 mt-9">
            <div className="relative">
              <div className="absolute bottom-1 whitespace-nowrap font-semibold text-xl w-fit bg-white pr-2 pl-1">
                Vendor Details
              </div>
            </div>
            <form onSubmit={handleVendorSubmit(onVendorSubmit)}>
              <div className="px-1 pt-2 w-full">
                <div className="w-full flex gap-3">
                  <div className="w-full mb-2">
                    <div className="text-sm font-semibold pb-1">Email</div>
                    <Input
                      placeholder="Email"
                      disabled
                      {...vendorRegister("email")}
                    />
                  </div>
                  <div className="w-full mb-2">
                    <div className="text-sm font-semibold pb-1">Phone</div>
                    <Controller
                      name="phone"
                      control={vendorControl}
                      render={({ field }) => (
                        <PhoneInput
                          placeholder="Phone"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="w-full flex gap-3">
                  <div className="w-full mb-2">
                    <div className="text-sm font-semibold pb-1">Name</div>
                    <Input
                      placeholder="Name"
                      {...vendorRegister("firstName")}
                    />
                  </div>
                  <div className="w-full mb-2"></div>
                </div>
                <div className="w-full flex justify-end mt-2">
                  <LoadingButton
                    isLoading={vendorLoading}
                    disabled={!formStateVendor.isValid || vendorLoading}
                    type="submit"
                  >
                    Save
                  </LoadingButton>
                </div>
              </div>
            </form>
          </div>

          <div className="border rounded-xl p-4 mt-9">
            <div className="relative">
              <div className="absolute bottom-1 whitespace-nowrap font-semibold text-xl w-fit bg-white pr-2 pl-1">
                Foodtruck Details
              </div>
            </div>
            <form onSubmit={handleSubmitFT(onSubmitFT)}>
              <div className="px-1 pt-2 w-full">
                <div className="w-full flex gap-3">
                  <div className="w-full mb-2">
                    <div className="text-sm font-semibold pb-1">Name</div>
                    <Input placeholder="Name" {...ftRegister("name")} />
                  </div>
                  <div className="w-full mb-2">
                    <div className="text-sm font-semibold pb-1">Type</div>
                    <Controller
                      name="infoType"
                      control={vendorControl}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="!h-10 min-w-[100px] bg-[#D9D9D933]">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value={"truck"}>Truck</SelectItem>
                              <SelectItem value={"caterer"}>Caterer</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
                <div className="w-full flex justify-end mt-2">
                  <LoadingButton
                    isLoading={loadingFT}
                    disabled={!formStateFT.isValid || loadingFT}
                    type="submit"
                  >
                    Save
                  </LoadingButton>
                </div>
              </div>
            </form>
          </div>

          <div className="border rounded-xl p-4 mt-9">
            <div className="relative">
              <div className="absolute bottom-1 whitespace-nowrap font-semibold text-xl w-fit bg-white pr-2 pl-1">
                Password
              </div>
            </div>
            <form onSubmit={handleSubmitPassword(onSubmitPassword)}>
              <div className="px-1 pt-2 w-full">
                <div className="w-full flex gap-3">
                  <div className="w-full mb-2">
                    <div className="text-sm font-semibold pb-1">Password</div>
                    <Input
                      type="password"
                      placeholder="Password"
                      {...passwordRegister("password")}
                    />
                  </div>

                  <div className="w-full mb-2">
                    <div className="text-sm font-semibold pb-1">
                      Confirm Password
                    </div>
                    <Input
                      type="password"
                      placeholder="Confirm Password"
                      {...passwordRegister("confirmPassword")}
                    />
                  </div>
                </div>
                <div className="w-full flex justify-end mt-2">
                  <LoadingButton
                    isLoading={loadingPassword}
                    disabled={!formStatePassword.isValid || loadingPassword}
                    type="submit"
                  >
                    Save
                  </LoadingButton>
                </div>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  );
}
