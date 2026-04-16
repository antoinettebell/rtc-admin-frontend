"use client";
import { ArrowLeft, User2 } from "lucide-react";
import * as React from "react";
import { useState } from "react";
import { userApiService } from "@/services/user-api-service";
import { fileApiService } from "@/services/file-api-service";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import * as z from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoadingButton } from "@/components/loading-button";
import { PhoneInput } from "@/components/phone-input";
import { toast } from "sonner";
import { StringHelper } from "@/models/string-helper-model";

export default function UserDetail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("q");
  const p = searchParams.get("p") || "";
  const l = searchParams.get("l") || "";

  const [userLoading, setUserLoading] = useState<boolean>(false);
  const [loadingPassword, setLoadingPassword] = useState<boolean>(false);
  const [loadingImage, setLoadingImage] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  if (!id) {
    return 404;
  }

  const goBackWithListState = () => {
    const params = new URLSearchParams();
    if (p) params.set("p", p);
    if (l) params.set("l", l);
    const qs = params.toString();
    router.replace(qs ? `/user?${qs}` : "/user");
  };

  const userFormSchema = z.object({
    email: z.string().email({ message: "Invalid email format." }),
    phone: z.string().min(8),
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    profilePic: z.string().optional(),
  });

  const passwordFormSchema = z.object({
    email: z.string().email(),
    userType: z.string().min(1),
  });

  const {
    register: userRegister,
    handleSubmit: handleUserSubmit,
    formState: formStateUser,
    reset: setUserValue,
    control: userControl,
    getValues: getUserValues,
    setValue,
  } = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
  });

  const {
    handleSubmit: handleSubmitPassword,
    reset: setPasswordForm,
  } = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      email: "",
      userType: "CUSTOMER",
    },
  });

  const onUserSubmit = async (data: z.infer<typeof userFormSchema>) => {
    const { firstName, lastName, phone } = data;
    const p = StringHelper.getPhoneCodeAndNumber(phone);

    setUserLoading(true);
    try {
      let profilePicUrl = data.profilePic;

        if (file) {
        setLoadingImage(true);
        const uploadRes = await fileApiService.upload(file);
        profilePicUrl = uploadRes.data.data.file;
        setValue("profilePic", profilePicUrl);
        setFile(null);
        setPreview(null);
        setLoadingImage(false);
      }

      await userApiService.update(id?.toString(), {
        firstName,
        lastName,
        countryCode: p.countryCode,
        mobileNumber: p.mobileNumber,
        profilePic: profilePicUrl,
      });

      toast.success("User details updated.");
      refetch(); // refresh data
    } catch (e) {
      console.log(e);
      toast.error("Something went wrong");
    } finally {
      setUserLoading(false);
    }
  };

  const onSubmitPassword = async (data: z.infer<typeof passwordFormSchema>) => {
    setLoadingPassword(true);
    userApiService
      .forgotPassword({
        email: data.email,
        userType: data.userType,
        forFe: true,
      })
      .then(() => {
        toast.success("Password reset link has been sent to your registered email.");
      })
      .catch((e) => {
        console.error(e);
        toast.error("Unable to send password reset link. Please try again later.");
      })
      .finally(() => {
        setLoadingPassword(false);
      });
  };

  const {
    data: result,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["user-detail", id],
    queryFn: () =>
      userApiService.getById(id?.toString() || "").then((userRes) => {
        const u = userRes?.data?.data?.user;
        console.log("==========userRes?.data?.data", userRes?.data?.data);

        setUserValue({
          email: u?.email,
          phone: (u?.countryCode ? `${u?.countryCode}` : "") + u?.mobileNumber,
          firstName: u?.firstName,
          lastName: u?.lastName,
          profilePic: u?.profilePic || "",
        });

        setPasswordForm({
          email: u?.email,
          userType: u?.userType,
        });

        return userRes?.data.data;
      }),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const user = result?.user;

  return (
    <>
      <div className="flex justify-between flex-wrap mb-2">
        <div className="font-semibold text-[28px] leading-[42px] mb-2 flex gap-3 items-center">
          <Button variant="outline" onClick={() => goBackWithListState()}>
            <ArrowLeft /> Back
          </Button>
          Edit User Detail
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

      {!!user && !isFetching && (
        <>
          {/* Profile Section */}
          {/* <div className="flex flex-wrap gap-4 mb-4">
            <div className="border w-fit rounded-xl p-4">
              <div className="flex flex-col items-center gap-3">
                <div className="w-[120px] h-[120px] rounded-full overflow-hidden border">
                  {preview ? (
                    <img
                      src={preview}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                  ) : user?.profilePic ? (
                    <img
                      src={user.profilePic}
                      alt="profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <User2 size={50} />
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="profileUpload"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFile(e.target.files[0]);
                      setPreview(URL.createObjectURL(e.target.files[0]));
                    }
                  }}
                />
                <label
                  htmlFor="profileUpload"
                  className="cursor-pointer text-sm text-blue-600"
                >
                  Change Profile
                </label>
              </div>
            </div>
          </div> */}
          <div className="flex justify-center mb-4">
            <div className="border w-fit rounded-xl p-4">
              <div className="flex flex-col items-center gap-3">
                <div className="w-[120px] h-[120px] rounded-full overflow-hidden border">
                  {preview ? (
                    <img
                      src={preview}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                  ) : user?.profilePic ? (
                    <img
                      src={user.profilePic}
                      alt="profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <User2 size={50} />
                    </div>
                  )}
                </div>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="profileUpload"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFile(e.target.files[0]);
                      setPreview(URL.createObjectURL(e.target.files[0]));
                    }
                  }}
                />

                <label
                  htmlFor="profileUpload"
                  className="cursor-pointer text-sm text-blue-600"
                >
                  Change Profile
                </label>
              </div>
            </div>
          </div>
          <div className="border rounded-xl p-4 mt-9">
            <div className="relative">
              <div className="absolute bottom-1 whitespace-nowrap font-semibold text-xl w-fit bg-white pr-2 pl-1">
                User Details
              </div>
            </div>
            <form onSubmit={handleUserSubmit(onUserSubmit)}>
              <div className="px-1 pt-2 w-full">
                <div className="w-full flex gap-3">
                  <div className="w-full mb-2">
                    <div className="text-sm font-semibold pb-1">Email</div>
                    <Input
                      placeholder="Email"
                      disabled
                      {...userRegister("email")}
                    />
                  </div>
                  <div className="w-full mb-2">
                    <div className="text-sm font-semibold pb-1">Phone</div>
                    <Controller
                      name="phone"
                      control={userControl}
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
                <div className="w-full flex gap-3 mt-2">
                  <div className="w-full mb-2">
                    <div className="text-sm font-semibold pb-1">First Name</div>
                    <Input placeholder="Name" {...userRegister("firstName")} />
                  </div>
                  <div className="w-full mb-2">
                    <div className="text-sm font-semibold pb-1">Last Name</div>
                    <Input placeholder="Name" {...userRegister("lastName")} />
                  </div>
                </div>
                <div className="w-full flex justify-end mt-2">
                  <LoadingButton
                    isLoading={userLoading || loadingImage}
                    disabled={!formStateUser.isValid || userLoading}
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
                    The link will be shared on user registered email.
                  </p>
                  <LoadingButton isLoading={loadingPassword} type="submit">
                    Send Link
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
