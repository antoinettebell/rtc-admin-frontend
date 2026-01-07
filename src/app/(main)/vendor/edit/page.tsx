"use client";
import { ArrowLeft, SquareUserRound } from "lucide-react";
import * as React from "react";
import { useState } from "react";
import { userApiService } from "@/services/user-api-service";
import { fileApiService } from "@/services/file-api-service";
import { publicApiService } from "@/services/public-api-service";

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
  const [loadingPlan, setLoadingPlan] = useState<boolean>(false);
  const [previewFtLogo, setPreviewFtLogo] = useState<string>("");
  const [ftFile, setFtFile] = useState<File | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previewPhotos, setPreviewPhotos] = useState<string[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
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
    logo: z.string().optional(),
    ssn: z.string().optional(),
    ein: z.string().optional(),
  });

  // const passwordFormSchema = z
  //   .object({
  //     password: z.string().min(8, "Password must be at least 8 characters"),
  //     confirmPassword: z.string(),
  //   })
  //   .refine((data) => data.password === data.confirmPassword, {
  //     message: "Passwords don't match",
  //     path: ["confirmPassword"],
  //   });

  const passwordFormSchema = z.object({
    email: z.string().email(),
    userType: z.string().min(1),
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
    control:ftControl,
    reset: setValueFT,
  } = useForm<z.infer<typeof ftFormSchema>>({
    resolver: zodResolver(ftFormSchema),
  });

  // const {
  //   register: passwordRegister,
  //   handleSubmit: handleSubmitPassword,
  //   formState: formStatePassword,
  //   getValues: getValuePassword,
  // } = useForm<z.infer<typeof passwordFormSchema>>({
  //   resolver: zodResolver(passwordFormSchema),
  // });

  const {
    handleSubmit: handleSubmitPassword,
    formState: formStatePassword,
    reset: setPasswordForm,
  } = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      email: "",
      userType: "VENDOR",
    },
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


  const onSubmitFT = async (data: z.infer<typeof ftFormSchema>) => {
    if (!result?.user?.foodTruck?._id) return;

    const { name, infoType,ssn,ein } = data;
    setLoadingFT(true);

    try {
      let logoUrl = null;
      if (ftFile) {
        const uploadRes = await fileApiService.upload(ftFile);
        logoUrl = uploadRes?.data?.data?.file || uploadRes?.path;
      }

      // ✅ Upload new photos
      let newPhotoUrls: string[] = [];
      if (photos.length > 0) {
        const uploaded = await Promise.all(
          photos.map((file) => fileApiService.upload(file))
        );
        newPhotoUrls = uploaded
          .map((u) => u?.data?.data?.file || u?.path)
          .filter(Boolean);
      }
      let existingPhotos: string[] = [];
      if (result?.user?.foodTruck?.photos?.length) {
        // Keep only those that are still in previewPhotos (not removed)
        existingPhotos = result.user.foodTruck.photos.filter((p: string) =>
          previewPhotos.includes(p)
        );
      } else {
        // No existing photos, use previewPhotos as base
        existingPhotos = [...previewPhotos];
      }
      // ✅ Merge existing + newly uploaded
      const finalPhotos = [...existingPhotos, ...newPhotoUrls];
      console.log("finalPhotos", finalPhotos);
      await foodTruckApiService.update(result?.user?.foodTruck?._id.toString(), {
        name,
        infoType,
        ssn,
        ein,
        ...(logoUrl ? { logo: logoUrl } : {}),
        photos: finalPhotos,
      });

      toast.success("Food truck details updated.");
      refetch();
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong");
    } finally {
      setLoadingFT(false);
    }
  };
  // const onSubmitFT = async (data: z.infer<typeof ftFormSchema>) => {
  //   if (!result?.user?.foodTruck?._id) return;
  
  //   const { name, infoType } = data;
  //   setLoadingFT(true);
  
  //   try {
  //     let logoUrl = null;
  
  //     if (ftFile) {
  //       const uploadRes = await fileApiService.upload(ftFile);
  //       logoUrl = uploadRes?.data?.data?.file || uploadRes?.path;
  //     }
  
  //     // ✅ Update food truck details
  //     await foodTruckApiService.update(result?.user?.foodTruck?._id.toString(), {
  //       name,
  //       infoType,
  //       ...(logoUrl ? { logo: logoUrl } : {}),
  //     });
  
  //     toast.success("Food truck details updated.");
  //     // Optionally refetch updated data
  //     refetch();
  //   } catch (e) {
  //     console.error(e);
  //     toast.error("Something went wrong");
  //   } finally {
  //     setLoadingFT(false);
  //   }
  // };
  

  // const onSubmitFT = (data: z.infer<typeof ftFormSchema>) => {
  //   if (!result?.user?.foodTruck?._id) return;
  //   const { name, infoType ,logo} = data;
  //   setLoadingFT(true);
  //   foodTruckApiService
  //     .update(result?.user?.foodTruck?._id?.toString(), { name,infoType })
  //     .then((res) => {
  //       toast.success("Food truck details updated.");
  //     })
  //     .catch((e) => {
  //       console.log(e);
  //       toast.error("Something went wrong");
  //     })
  //     .finally(() => {
  //       setLoadingFT(false);
  //     });
  // };

  // const onSubmitPassword = (data: z.infer<typeof passwordFormSchema>) => {
  //   const { password, confirmPassword } = data;
  //   setLoadingPassword(true);
  //   userApiService
  //     .update(id?.toString(), { password })
  //     .then((res) => {
  //       toast.success("Password updated.");
  //     })
  //     .catch((e) => {
  //       console.log(e);
  //       toast.error("Something went wrong");
  //     })
  //     .finally(() => {
  //       setVendorLoading(false);
  //     });
  // };

  const onSubmitPassword = async (data: z.infer<typeof passwordFormSchema>) => {
    setLoadingPassword(true);
    userApiService.forgotPassword({
        email: data.email,
        userType: data.userType,
        forFe: true,
      }).then(() => {
        toast.success("Password reset link has been sent to vendor registered email.");
      }).catch((e) => {
        console.error(e);
        toast.error("Unable to send password reset link. Please try again later.");
      }).finally(() => {
        setLoadingPassword(false);
      });
  };

  const onUpdatePlan = async () => {
    if (!result?.user?.foodTruck?._id || !selectedPlan) return;
    
    setLoadingPlan(true);
    try {
      await foodTruckApiService.update(result.user.foodTruck._id.toString(), {
        planId: selectedPlan,
        addOns: selectedAddons
      });
      toast.success("Plan and addons updated successfully.");
      refetch();
    } catch (e) {
      console.error(e);
      toast.error("Failed to update plan and addons.");
    } finally {
      setLoadingPlan(false);
    }
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
        
      publicApiService.getPlanList("", 1, 100),
      publicApiService.getAddOnsList("", 1, 100),
// categoryApiService.list("", 1, 100, { userId: id?.toString() }),
      ]).then(([userRes, planRes, addonRes]) => {
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
        setPasswordForm({
          email: userRes?.data?.data?.user?.email,
          userType: userRes?.data?.data?.user?.userType,
        });
        setValueFT({
          name: userRes?.data?.data?.user?.foodTruck?.name,
          infoType: userRes?.data?.data?.user?.foodTruck?.infoType,
          logo: userRes?.data?.data?.user?.foodTruck?.logo || "",
          ssn: userRes?.data?.data?.user?.foodTruck?.ssn,
          ein: userRes?.data?.data?.user?.foodTruck?.ein,
        });
        setPreviewPhotos(userRes?.data?.data?.user?.foodTruck?.photos || []);
        setSelectedPlan(userRes?.data?.data?.user?.foodTruck?.planId || "");
        setSelectedAddons(userRes?.data?.data?.user?.foodTruck?.addOns?.map((addon: any) => addon._id) || []);
        console.log("addonRes",addonRes);
        return {
          ...(userRes?.data.data || {}),
          planList: planRes?.data?.data?.planList || [],
          addonList: addonRes.data.data?.addonsList || [],
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


              <div className="mb-6 mt-4">
              <p className="text-sm font-semibold mb-2">Change Logo</p>
              <div className="flex items-center gap-4">
                <div className="w-[100px] h-[100px] rounded-full overflow-hidden border">
                  {previewFtLogo ? (
                    <img
                      src={previewFtLogo}
                      alt="logo"
                      className="w-full h-full object-cover"
                      suppressHydrationWarning
                    />
                  ) : result?.user?.foodTruck?.logo ? (
                    <img
                      src={result.user.foodTruck.logo}
                      alt="logo"
                      className="w-full h-full object-cover"
                      suppressHydrationWarning
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <SquareUserRound size={40} />
                    </div>
                  )}
                </div>

                <div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="logoUpload"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setFtFile(e.target.files[0]);
                        setPreviewFtLogo(URL.createObjectURL(e.target.files[0]));
                      }
                    }}
                  />
                  <label
                    htmlFor="logoUpload"
                    className="px-4 py-2 border rounded-lg flex items-center gap-2 cursor-pointer hover:bg-gray-50"
                  >
                    Upload Logo
                  </label>
                </div>
              </div>
            </div>
              {/* <div className="flex items-center gap-3 mb-4">
                    <div className="w-[100px] h-[100px] rounded-full overflow-hidden border">
                      {previewFtLogo ? (
                        <img
                          src={previewFtLogo}
                          alt="logo"
                          className="w-full h-full object-cover"
                        />
                      ) : result.user.foodTruck?.logo ? (
                        <img
                          src={result.user.foodTruck?.logo}
                          alt="logo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          <SquareUserRound size={40} />
                        </div>
                      )}
                    </div>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setFtFile(e.target.files[0]); // store file
                            setPreviewFtLogo(URL.createObjectURL(e.target.files[0])); // show preview
                          }
                        }}
                      />
                  </div> */}
                  <div className="mb-6">
              <p className="text-sm font-semibold mb-2">Change Food Truck Photos</p>
              <div className="flex items-center gap-3 flex-wrap">
                {previewPhotos.map((photo, idx) => (
                  <div
                    key={idx}
                    className="relative w-[90px] h-[90px] rounded-md overflow-hidden border"
                  >
                    <img
                      src={photo}
                      alt={`photo-${idx}`}
                      className="w-full h-full object-cover"
                      suppressHydrationWarning
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewPhotos((prev) => prev.filter((_, i) => i !== idx));
                        setPhotos((prev) =>
                          prev.filter((_, i) => i !== idx - (result?.user?.foodTruck?.photos?.length || 0))
                        );
                      }}
                      className="absolute top-1 right-1 bg-orange-500 rounded-full p-1 text-white text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className="w-[90px] h-[90px] flex items-center justify-center border rounded-md cursor-pointer hover:bg-gray-50">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    id="photoUpload"
                    onChange={(e) => {
                      if (e.target.files) {
                        const files = Array.from(e.target.files);
                        setPhotos((prev) => [...prev, ...files]);
                        setPreviewPhotos((prev) => [
                          ...prev,
                          ...files.map((f) => URL.createObjectURL(f)),
                        ]);
                      }
                    }}
                  />
                  <label
                    htmlFor="photoUpload"
                    className="text-orange-500 text-2xl font-bold cursor-pointer"
                  >
                    +
                  </label>
                </div>
              </div>
            </div>  
                <div className="w-full flex gap-3">
                  <div className="w-full mb-2">
                    <div className="text-sm font-semibold pb-1">Name</div>
                    <Input placeholder="Name" {...ftRegister("name")} />
                  </div>
                  <div className="w-full mb-2">
                    <div className="text-sm font-semibold pb-1">Type</div>
                    <Controller
                      name="infoType"
                      control={ftControl}
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
                  <div className="w-full flex gap-3">

                  <div className="w-full mb-2">
                    <div className="text-sm font-semibold pb-1">Ssn</div>
                    <Input placeholder="ssn" {...ftRegister("ssn")} />
                  </div>
                  <div className="w-full mb-2">
                    <div className="text-sm font-semibold pb-1">Ein</div>
                    <Input placeholder="ein" {...ftRegister("ein")} />
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
                <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
                  <p>
                    If you change the password, click on the{" "}
                    <span className="font-semibold">Send Link</span> button.  
                    The link will be shared on vendor registered email.
                  </p>
                  <LoadingButton
                    isLoading={loadingPassword}
                    type="submit"
                  >
                    Send Link
                  </LoadingButton>
                </div>
              </div>
            </form>
            {/* <form onSubmit={handleSubmitPassword(onSubmitPassword)}>
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
            </form> */}
          </div>
          <div className="border rounded-xl p-4 mt-9">
            <div className="relative">
              <div className="absolute bottom-1 whitespace-nowrap font-semibold text-xl w-fit bg-white pr-2 pl-1">
                Plan & Add-ons Management
              </div>
            </div>
            <div className="px-1 pt-2 w-full">
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2">Current Plan</h4>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="w-4 h-4 rounded" 
                      style={{ backgroundColor: result?.user?.foodTruck?.plan?.titleColor || '#gray' }}
                    ></div>
                    <span className="font-medium text-lg">{result?.user?.foodTruck?.plan?.name || 'No plan assigned'}</span>
                    <span className="text-sm text-gray-600">({result?.user?.foodTruck?.plan?.slug})</span>
                  </div>
                  {result?.user?.foodTruck?.plan && (
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Rate:</span> {result.user.foodTruck.plan.rate}% {result.user.foodTruck.plan.rateType}
                      </div>
                      {result.user.foodTruck.plan.details && (
                        <div>
                          <span className="font-medium text-sm">Features:</span>
                          <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                            {result.user.foodTruck.plan.details.map((detail: string, idx: number) => (
                              <li key={idx}>{detail}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2">Current Add-ons</h4>
                <div className="p-3 bg-gray-50 rounded-lg">
                  {result?.user?.foodTruck?.addOns?.length > 0 ? (
                    <div className="space-y-2">
                      {result.user.foodTruck.addOns.map((addon: any, idx: number) => (
                        <div key={idx} className="p-2 bg-blue-50 border border-blue-200 rounded">
                          <div className="font-medium text-blue-800">{addon.name}</div>
                          <div className="text-xs text-gray-500">Added: {new Date(addon.createdAt).toLocaleDateString()}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-500">No add-ons assigned</span>
                  )}
                </div>
              </div>

              <div className="w-full flex gap-3 mb-4">
                <div className="w-full">
                  <div className="text-sm font-semibold pb-1">Select Plan</div>
                  <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                    <SelectTrigger className="!h-10 bg-[#D9D9D933]">
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {result?.planList?.map((plan: any) => (
                          <SelectItem key={plan._id} value={plan._id}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded" 
                                style={{ backgroundColor: plan.titleColor || '#gray' }}
                              ></div>
                              {plan.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-sm font-semibold pb-2">Select Add-ons (Multiple)</div>
                <div className="grid grid-cols-2 gap-2">
                  {result?.addonList?.map((addon: any) => (
                    <label key={addon._id} className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedAddons.includes(addon._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAddons(prev => [...prev, addon._id]);
                          } else {
                            setSelectedAddons(prev => prev.filter(id => id !== addon._id));
                          }
                        }}
                      />
                      <span className="text-sm">{addon.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="w-full flex justify-end mt-4">
                <LoadingButton
                  isLoading={loadingPlan}
                  disabled={!selectedPlan || loadingPlan}
                  onClick={onUpdatePlan}
                >
                  Update Plan & Add-ons
                </LoadingButton>
              </div>
            </div>
          </div>

          
        </>
      )}
    </>
  );
}
