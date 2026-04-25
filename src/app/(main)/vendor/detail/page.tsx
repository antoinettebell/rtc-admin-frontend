"use client";
import {
  ArrowLeft,
  Check,
  LoaderCircle,
  MapPin,
  Soup,
  SquareUserRound,
  X,
} from "lucide-react";
import * as React from "react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { userApiService } from "@/services/user-api-service";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Status } from "@/components/ui/status";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { categoryApiService } from "@/services/category-api-service";
import { menuApiService } from "@/services/menu-api-service";
import {
  MenuItem,
  Review,
  ReviewStats,
  User,
} from "@/interfaces/user-interface";
import dayjs from "dayjs";
import PhotoViewer from "@/components/ui/photo-viewer";
import { foodTruckApiService } from "@/services/food-truck-api-service";
import { Switch } from "@/components/ui/switch";
import { reviewApiService } from "@/services/review-api-service";
import { StringHelper } from "@/models/string-helper-model";
import { Textarea } from "@/components/ui/textarea";
import { BankDetailsDisplay } from "@/components/bank-details-display";
import { decryptFields } from "@/utils/encryption";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VendorMenuCsvImport } from "@/components/vendor-menu-csv-import";

export default function VendorDetail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("q");
  const p = searchParams.get("p") || "";
  const l = searchParams.get("l") || "";
  const goBackWithListState = () => {
    const params = new URLSearchParams();
    if (p) params.set("p", p);
    if (l) params.set("l", l);
    const qs = params.toString();
    router.replace(qs ? `/vendor?${qs}` : "/vendor");
  };
  const [changeStatus, setChangeStatus] = useState<
    "APPROVED" | "REJECTED" | null
  >(null);
  const [reason, setReason] = useState<string>("");
  const [changing, setChanging] = useState<boolean>(false);
  const [planColor, setPlanColor] = useState<string>("");
  const [locations, setLocations] = useState<Record<string, string>>({});

  const [changeFeature, setChangeFeature] = useState<User | null>(null);
  const [changingFeature, setChangingFeature] = useState<boolean>(false);
  const [isFeatured, setIsFeatured] = useState<boolean>(false);

  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [reviewList, setReviewList] = useState<Review[]>([]);
  const [page, setPage] = useState<number>(1);
  const [showMore, setShowMore] = useState<boolean>(true);

  const days = {
    sun: "Sunday",
    mon: "Monday",
    tue: "Tuesday",
    wed: "Wednesday",
    thu: "Thursday",
    fri: "Friday",
    sat: "Saturday",
  };

  if (!id) {
    return 404 as any;
  }

  const {
    data: result,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["vendor-detail"],
    queryFn: () =>
      Promise.all([
        userApiService.getById(id?.toString() || ""),
        categoryApiService.list("", 1, 100, { userId: id?.toString() }),
        menuApiService.list("", 1, 100, { userId: id?.toString() }),
      ]).then(([userRes, categoryRes, menuRes]) => {
        console.log("==========userRes?.data?.data", userRes?.data?.data);

        if (userRes.data?.data.user.foodTruck?.plan) {
          setPlanColor(
            userRes.data?.data.user.foodTruck?.plan?.titleColor || "",
          );
        }
        setIsFeatured(!!userRes?.data?.data?.user?.foodTruck?.featured);

        userRes?.data?.data?.user?.foodTruck?.locations?.map((loc) => {
          if (loc.address) {
            const address = loc.address;
            const addressParts = address.split(",");
            const city = addressParts[addressParts.length - 2];
            const state = addressParts[addressParts.length - 1];
            setLocations((prev) => ({
              ...prev,
              [loc._id]: `${city}, ${state}`,
            }));
          }
        });

        // Decrypt bank details here (using cryptlib via utils/encryption)
        try {
          const secretKey = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET_KEY || "";
          const userAny = userRes?.data?.data?.user as any;
          if (secretKey && userAny?.bankDetail) {
            userAny.bankDetail = decryptFields(
              userAny.bankDetail,
              [
                "accountHolderName",
                "bankName",
                "accountNumber",
                "routingNumber",
                "accountType",
                "remittanceEmail",
                "currency",
                "swiftCode",
                "iban",
                "paymentMethod",
              ] as (keyof typeof userAny.bankDetail)[],
              secretKey,
            );
          }
        } catch (e) {
          console.error("error userAny.bankDetail:", e);
        }

        getStats(userRes?.data?.data?.user?.foodTruck?._id || "");
        getMoreReview(userRes?.data?.data?.user?.foodTruck?._id || "", 1);
        return {
          ...(userRes?.data.data || {}),
          // Casts below keep the logic intact while satisfying TS
          categoryList: (categoryRes as any).data.data.records,
          menuList: (menuRes as any).data.data.records,
        } as any;
      }),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const getStats = (ftId: string) => {
    reviewApiService.stats(ftId).then((res) => {
      setReviewStats((res as any).data.data);
    });
  };

  const getMoreReview = (ftId: string, p: number) => {
    reviewApiService.list(ftId, "", p, 10).then((res) => {
      setReviewList(
        p > 1
          ? [...reviewList, ...((res as any).data.data.records as Review[])]
          : ((res as any).data.data.records as Review[]),
      );
      setShowMore(((res as any).data.data.total as number) > page * 10);
      setPage(p + 1);
    });
  };

  const onStatusChange = () => {
    if (!id || !changeStatus) return;
    if (changeStatus === "REJECTED" && !reason.trim().length) return;
    setChanging(true);
    userApiService
      .changeRequest(id, changeStatus, reason)
      .then((res) => {
        setChangeStatus(null);
        setReason("");
        refetch();
        toast.success("Status has been changed.");
      })
      .catch((e) => {
        console.log(e);
        toast.error("Something went wrong while changing the status.");
      })
      .finally(() => {
        setChanging(false);
      });
  };

  const onFeatureChange = () => {
    if (
      !changeFeature ||
      !!changeFeature.foodTruck?.inactive ||
      !changeFeature.foodTruck?._id
    )
      return;
    setChangingFeature(true);
    foodTruckApiService
      .updateExtra(changeFeature.foodTruck._id, !isFeatured)
      .then((res) => {
        toast.success("Feature mark is changed.");
        setIsFeatured(!isFeatured);
        setChangeFeature(null);
      })
      .catch((e) => {
        console.log(e);
        toast.error("Something went wrong");
      })
      .finally(() => {
        setChangingFeature(false);
      });
  };

  return (
    <>
      <div className="sticky top-0 z-30 bg-white dark:bg-background border-b flex justify-between flex-wrap mb-2 py-2">
        <div className="font-semibold text-[28px] leading-[42px] mb-2 flex gap-3 items-center">
          <Button variant="outline" onClick={goBackWithListState}>
            <ArrowLeft /> Back
          </Button>
          Vendor Detail
        </div>

        {!isFetching && (
          <div className="flex gap-2">
            <Button
              variant="default"
              className="bg-green-500 hover:bg-green-600 font-semibold px-6"
              disabled={changing || result?.user.requestStatus === "APPROVED"}
              onClick={() => {
                setChangeStatus("APPROVED");
                setReason("");
              }}
            >
              Approve
            </Button>
            <Button
              variant="default"
              className="bg-red-500 hover:bg-red-600 font-semibold px-6"
              disabled={changing || result?.user.requestStatus === "REJECTED"}
              onClick={() => {
                setChangeStatus("REJECTED");
                setReason("");
              }}
            >
              Reject
            </Button>
          </div>
        )}
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
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="sticky top-[64px] z-20 bg-white dark:bg-background border-b mb-4 flex flex-wrap gap-2">
              <TabsTrigger
                value="profile"
                className="rounded-md border px-3 py-1 data-[state=active]:border-primary data-[state=active]:bg-primary/5"
              >
                Profile
              </TabsTrigger>
              <TabsTrigger
                value="details"
                className="rounded-md border px-3 py-1 data-[state=active]:border-primary data-[state=active]:bg-primary/5"
              >
                Cusines
              </TabsTrigger>
              <TabsTrigger
                value="gallery"
                className="rounded-md border px-3 py-1 data-[state=active]:border-primary data-[state=active]:bg-primary/5"
              >
                Photo Gallery
              </TabsTrigger>
              <TabsTrigger
                value="menu-categories"
                className="rounded-md border px-3 py-1 data-[state=active]:border-primary data-[state=active]:bg-primary/5"
              >
                Menu Categories
              </TabsTrigger>
              <TabsTrigger
                value="menu-items"
                className="rounded-md border px-3 py-1 data-[state=active]:border-primary data-[state=active]:bg-primary/5"
              >
                Menu Items
              </TabsTrigger>
              {/* <TabsTrigger value="bank" className="rounded-md border px-3 py-1 data-[state=active]:border-primary data-[state=active]:bg-primary/5">Bank Details</TabsTrigger> */}
              <TabsTrigger
                value="locations"
                className="rounded-md border px-3 py-1 data-[state=active]:border-primary data-[state=active]:bg-primary/5"
              >
                Locations
              </TabsTrigger>
              <TabsTrigger
                value="availability"
                className="rounded-md border px-3 py-1 data-[state=active]:border-primary data-[state=active]:bg-primary/5"
              >
                Availability
              </TabsTrigger>
              <TabsTrigger
                value="business-hours"
                className="rounded-md border px-3 py-1 data-[state=active]:border-primary data-[state=active]:bg-primary/5"
              >
                Business Hours
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="rounded-md border px-3 py-1 data-[state=active]:border-primary data-[state=active]:bg-primary/5"
              >
                Reviews
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <div className="flex flex-wrap gap-4 mb-4">
                {/* <div
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
                          Vendor: {" "}
                          <b>
                            {`${result?.user.firstName} ${result?.user.lastName || ""}`.trim()}
                          </b>
                        </h3>
                        <p className="text-sm text-muted-foreground mb-1">
                          Food Truck Name: <b>{result.user.foodTruck?.name}</b>
                        </p>
                        <p className="text-sm text-muted-foreground mb-1">
                          Type:{" "}
                          <b className="capitalize">
                            {result.user.foodTruck?.infoType || "-"}
                          </b>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Completed:{" "}
                          <b className="capitalize">
                            {result.user.foodTruck?.completed ? "Yes" : "No"}
                          </b>
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between w-full mt-2">
                      <Status
                        status={(result?.user.requestStatus || "PENDING") as any}
                        className={"!py-1.5" as any}
                      />
                      <p className="text-sm text-muted-foreground flex items-center">
                        Featured:{" "}
                        <Switch
                          checked={isFeatured}
                          disabled={result.user.requestStatus !== "APPROVED"}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setChangeFeature(result.user);
                          }}
                          title={
                            result.user.requestStatus !== "APPROVED"
                              ? "It will be enabled after the request approved"
                              : ""
                          }
                        />
                      </p>
                    </div>
                  </div>
                </div> */}
                <div className="relative overflow-hidden rounded-xl border shadow-lg bg-white">
                  {/* Plan Header */}
                  <div
                    className="px-4 py-2 text-center"
                    style={{
                      background: planColor || "#6B7280",
                    }}
                  >
                    <div className="text-lg font-bold text-white">
                      {result?.user.foodTruck?.plan?.name || "No Plan"}
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="p-4">
                    <div className="flex gap-4">
                      {/* Avatar Section */}
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md">
                          <SquareUserRound size={32} className="text-white" />
                        </div>
                      </div>

                      {/* Info Section */}
                      <div className="flex-1 min-w-0">
                        <div className="mb-3">
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {`${result?.user.firstName || ""} ${result?.user.lastName || ""}`.trim() ||
                              "N/A"}
                          </h3>
                          <p className="text-sm text-gray-500">Vendor</p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span className="text-sm text-gray-600">
                              Food Truck:
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              {result.user.foodTruck?.name || "N/A"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-sm text-gray-600">Type:</span>
                            <span className="text-sm font-semibold text-gray-900 capitalize">
                              {result.user.foodTruck?.infoType || "-"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${result.user.foodTruck?.completed ? "bg-green-500" : "bg-orange-500"}`}
                            ></div>
                            <span className="text-sm text-gray-600">
                              Status:
                            </span>
                            <span
                              className={`text-sm font-semibold capitalize ${
                                result.user.foodTruck?.completed
                                  ? "text-green-700"
                                  : "text-orange-700"
                              }`}
                            >
                              {result.user.foodTruck?.completed
                                ? "Completed"
                                : "Incomplete"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Section */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <Status
                        status={
                          (result?.user.requestStatus || "PENDING") as any
                        }
                        className={"!py-1.5" as any}
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Featured:</span>
                        <Switch
                          checked={isFeatured}
                          disabled={result.user.requestStatus !== "APPROVED"}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setChangeFeature(result.user);
                          }}
                          title={
                            result.user.requestStatus !== "APPROVED"
                              ? "It will be enabled after the request approved"
                              : ""
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {result?.user.foodTruck?.plan && (
                  <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 shadow-sm h-fit w-fit max-w-full">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="text-lg font-bold text-blue-700">
                        Purchase Plan Details
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-blue-700 min-w-[80px]">
                          Plan:
                        </span>
                        <span className="bg-blue-200 px-2 py-1 rounded-full text-blue-800 font-medium">
                          {result.user.foodTruck.plan.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-blue-700 min-w-[80px]">
                          Rate:
                        </span>
                        <span className="text-blue-800 font-medium">
                          {result.user.foodTruck.plan.rate}%{" "}
                          {result.user.foodTruck.plan.rateType}
                        </span>
                      </div>
                      {result.user.foodTruck.plan.details &&
                        result.user.foodTruck.plan.details.length > 0 && (
                          <div className="mt-3">
                            <span className="font-semibold text-blue-700 block mb-2">
                              Features:
                            </span>
                            <div className="bg-white/50 rounded-md p-3">
                              <ul className="space-y-1">
                                {result.user.foodTruck.plan.details.map(
                                  (detail: string, index: number) => (
                                    <li
                                      key={index}
                                      className="flex items-start gap-2 text-blue-800"
                                    >
                                      <span className="text-blue-500 mt-1">
                                        ✓
                                      </span>
                                      <span>{detail}</span>
                                    </li>
                                  ),
                                )}
                              </ul>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                )}

                {result?.user.foodTruck?.addOns &&
                  result.user.foodTruck.addOns.length > 0 && (
                    <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100 border border-green-200 shadow-sm h-fit w-fit max-w-full">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" />
                          </svg>
                        </div>
                        <div className="text-lg font-bold text-green-700">
                          Add-Ons ({result.user.foodTruck.addOns.length})
                        </div>
                      </div>
                      <div className="bg-white/50 rounded-md p-3">
                        <div className="space-y-2">
                          {result.user.foodTruck.addOns.map(
                            (addOn: any, index: number) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 p-2 bg-white rounded border border-green-200"
                              >
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-green-800 font-medium">
                                  {addOn.name}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                  )}

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
            </TabsContent>

            <TabsContent value="details">
              <div className="flex items-center gap-3 mt-3">
                <div className="whitespace-nowrap font-semibold text-xl">
                  Cuisines
                </div>
                <div className="border-b w-full"></div>
              </div>
              <div className="pt-2 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 5xl:grid-cols-4 gap-4 *:data-[slot=card]:shadow-xs *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card">
                  {result.user.foodTruck?.cuisine.map(
                    (item: any, i: number) => (
                      <div
                        key={`${i}-cui`}
                        className="border rounded-md px-3 py-2 flex items-center gap-2"
                      >
                        <Soup size={20} className="text-primary" />
                        {item.name}
                      </div>
                    ),
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="gallery">
              <div className="pt-2 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="col-span-1">
                    <div className="rounded-lg overflow-hidden border shadow-sm">
                      {result.user.foodTruck?.logo ? (
                        <PhotoViewer src={result.user.foodTruck.logo}>
                          <img
                            src={result.user.foodTruck.logo}
                            alt="Food Truck Logo"
                            className="w-full h-48 object-cover transition-transform duration-300 hover:scale-105 cursor-pointer"
                          />
                        </PhotoViewer>
                      ) : (
                        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                          No Logo uploaded yet
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-span-3">
                    {(result.user.foodTruck?.photos?.length ?? 0) > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {(result.user.foodTruck?.photos ?? []).map(
                          (photo: string, i: number) => (
                            <div
                              key={`${i}-truck-photo`}
                              className="rounded-lg overflow-hidden border shadow-sm"
                            >
                              <PhotoViewer src={photo}>
                                <img
                                  src={photo}
                                  alt={`Food Truck Photo ${i + 1}`}
                                  className="w-full h-40 object-cover transition-transform duration-300 hover:scale-105 cursor-pointer"
                                />
                              </PhotoViewer>
                            </div>
                          ),
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm">
                        No Photos uploaded yet
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="menu-categories">
              <div className="flex items-center gap-3 mt-3">
                <div className="whitespace-nowrap font-semibold text-xl">
                  Menu Category
                </div>
                <div className="border-b w-full"></div>
              </div>
              <div className="pt-2 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 5xl:grid-cols-3 gap-4 *:data-[slot=card]:shadow-xs *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card">
                  {(result.categoryList || [])?.map((item: any, i: number) => (
                    <div
                      key={`${i}-category`}
                      className="border rounded-md px-3 py-2 flex items-center"
                    >
                      <div className="flex items-center gap-3">
                        <div className="truncate">{item.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="menu-items">
              <div className="flex items-center gap-3 mt-3">
                <div className="whitespace-nowrap font-semibold text-xl">
                  Menu
                </div>
                <div className="border-b w-full"></div>
              </div>
              <div className="pt-2 pb-4">
                <div className="mb-4">
                  <VendorMenuCsvImport
                    vendorName={
                      result.user.foodTruck?.name ||
                      `${result.user.firstName} ${result.user.lastName || ""}`.trim() ||
                      "this vendor"
                    }
                    vendorUserId={result.user._id}
                    menuItems={result.menuList || []}
                    onImported={() => {
                      refetch();
                    }}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 5xl:grid-cols-3 gap-4 *:data-[slot=card]:shadow-xs *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card">
                  {(result.menuList || [])?.map((item: MenuItem, i: number) => (
                    <div
                      key={`${i}-availability`}
                      className="border rounded-md p-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-md w-[130px] h-[130px] flex items-center justify-center bg-gray-100 overflow-hidden">
                          {!!item.imgUrls.length && (
                            <PhotoViewer src={item.imgUrls[0]}>
                              <img
                                src={item.imgUrls[0]}
                                className="h-full w-full object-cover transition-all hover:scale-105 aspect-square cursor-pointer"
                              />
                            </PhotoViewer>
                          )}
                        </div>
                        <div className="h-full w-full max-w-full">
                          <div className="truncate font-bold text-xl capitalize">
                            {item.name}
                          </div>
                          <div
                            className="line-clamp-2"
                            title={item.description || "-"}
                          >
                            {item.description || "-"}
                          </div>
                          <div className="truncate w-fit">
                            Type:{" "}
                            {item.itemType === "INDIVIDUAL" ? (
                              <b>Individual</b>
                            ) : (
                              <b>Combo</b>
                            )}
                          </div>
                          <div className="truncate">
                            item.price Price:{" "}
                            <b>
                              {item.price
                                ? `$${Number(item.price).toFixed(2)}`
                                : "$0.00"}
                            </b>
                          </div>
                          <div className="truncate">
                            Discount:{" "}
                            <b>
                              {item.discount
                                ? `${item?.discountType === "PERCENTAGE" ? "%" : "$"}${Number(item.discount).toFixed(2)}`
                                : "-"}
                            </b>
                          </div>
                        </div>
                      </div>
                      <div
                        className={`rounded-full w-5 h-5 flex items-center justify-center text-white ${item.available ? "bg-green-500" : "bg-gray-500"}`}
                      >
                        {item.available ? (
                          <Check strokeWidth={3} size={16} />
                        ) : (
                          <X strokeWidth={3} size={16} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="bank">
              <div className="flex items-center gap-3 mt-3">
                <div className="whitespace-nowrap font-semibold text-xl">
                  Bank Account Information
                </div>
                <div className="border-b w-full"></div>
              </div>
              <BankDetailsDisplay userData={result?.user} />
            </TabsContent>

            <TabsContent value="locations">
              <div className="flex items-center gap-3 mt-3">
                <div className="whitespace-nowrap font-semibold text-xl">
                  Locations
                </div>
                <div className="border-b w-full"></div>
              </div>
              <div className="pt-2 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 5xl:grid-cols-3 gap-4 *:data-[slot=card]:shadow-xs *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card">
                  {result.user.foodTruck?.locations.map(
                    (item: any, i: number) => (
                      <div
                        key={`${i}-location`}
                        className="border rounded-md px-3 py-2 flex items-center gap-3"
                      >
                        <div>
                          <MapPin className="text-primary" />
                        </div>
                        <div className="w-full pr-[24px]">
                          <div className="font-semibold truncate">
                            {item.title}
                          </div>
                          <div className="font-medium text-sm truncate">
                            {item.address}
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="availability">
              <div className="flex items-center gap-3 mt-3">
                <div className="whitespace-nowrap font-semibold text-xl">
                  Availability
                </div>
                <div className="border-b w-full"></div>
              </div>
              <div className="pt-2 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 5xl:grid-cols-3 gap-4 *:data-[slot=card]:shadow-xs *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card">
                  {result.user.foodTruck?.availability.map(
                    (item: any, i: number) => (
                      <div
                        key={`${i}-availability`}
                        className="border rounded-md px-3 py-2 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-primary w-[50px] h-[50px] flex items-center justify-center text-white font-semibold capitalize">
                            {item.day}
                          </div>
                          <div>
                            <div className="truncate">
                              Location:{" "}
                              <span className="font-semibold">
                                {locations[item.locationId]}
                              </span>
                            </div>
                            <div className="flex gap-4">
                              <div>
                                Start{" "}
                                <span className="font-semibold">
                                  {dayjs(
                                    `0000-00-00 ${item.startTime}:00`,
                                  ).format("hh:mm A")}
                                </span>
                              </div>
                              <div>
                                Close{" "}
                                <span className="font-semibold">
                                  {dayjs(
                                    `0000-00-00 ${item.endTime}:00`,
                                  ).format("hh:mm A")}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div
                          className={`rounded-full w-5 h-5 flex items-center justify-center text-white ${item.available ? "bg-green-500" : "bg-gray-500"}`}
                        >
                          {item.available ? (
                            <Check strokeWidth={3} size={16} />
                          ) : (
                            <X strokeWidth={3} size={16} />
                          )}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="business-hours">
              <div className="flex items-center gap-3 mt-3">
                <div className="whitespace-nowrap font-semibold text-xl">
                  Business hours
                </div>
                <div className="border-b w-full"></div>
              </div>
              <div className="pt-2 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 5xl:grid-cols-3 gap-4 *:data-[slot=card]:shadow-xs *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card">
                  {result.user.foodTruck?.businessHours?.map(
                    (item: any, i: number) => (
                      <div
                        key={`${i}-availability`}
                        className="border rounded-md px-3 py-2 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="truncate">
                              Location:{" "}
                              <span className="font-semibold">
                                {locations[item.locationId]}
                              </span>
                            </div>
                            <div className="flex gap-4">
                              <div>
                                Start{" "}
                                <span className="font-semibold">
                                  {dayjs(
                                    `0000-00-00 ${item.startTime}:00`,
                                  ).format("hh:mm A")}
                                </span>
                              </div>
                              <div>
                                Close{" "}
                                <span className="font-semibold">
                                  {dayjs(
                                    `0000-00-00 ${item.endTime}:00`,
                                  ).format("hh:mm A")}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div
                          className={`rounded-full w-5 h-5 flex items-center justify-center text-white ${item.available ? "bg-green-500" : "bg-gray-500"}`}
                        >
                          {item.available ? (
                            <Check strokeWidth={3} size={16} />
                          ) : (
                            <X strokeWidth={3} size={16} />
                          )}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reviews">
              <div className="flex items-center gap-3 mt-3">
                <div className="whitespace-nowrap font-semibold text-xl">
                  Review
                </div>
                <div className="border-b w-full"></div>
              </div>
              <div className="review-stats flex gap-6 items-center pt-4 w-full border-t mt-4">
                <div className="flex flex-col items-center min-w-[5rem]">
                  <div className="flex gap-2 items-center">
                    <svg
                      width="36"
                      height="34"
                      viewBox="0 0 36 34"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M17.9991 28.4835L9.2738 33.6812C8.88834 33.9237 8.48536 34.0277 8.06487 33.993C7.64437 33.9584 7.27644 33.8198 6.96106 33.5772C6.64569 33.3347 6.4004 33.0318 6.22519 32.6687C6.04999 32.3055 6.01495 31.898 6.12007 31.4462L8.4328 21.6225L0.706174 15.0214C0.35576 14.7095 0.137101 14.354 0.0501985 13.9548C-0.0367042 13.5556 -0.0107737 13.1662 0.12799 12.7864C0.266754 12.4066 0.477003 12.0947 0.758735 11.8508C1.04047 11.6068 1.42592 11.4509 1.9151 11.383L12.1121 10.4994L16.0543 1.24745C16.2295 0.831634 16.5014 0.519771 16.8701 0.311862C17.2387 0.103954 17.6151 0 17.9991 0C18.3832 0 18.7595 0.103954 19.1281 0.311862C19.4968 0.519771 19.7687 0.831634 19.9439 1.24745L23.8861 10.4994L34.0831 11.383C34.5737 11.4523 34.9591 11.6082 35.2395 11.8508C35.5198 12.0933 35.73 12.4052 35.8702 12.7864C36.0104 13.1675 36.037 13.5577 35.9501 13.9569C35.8632 14.3561 35.6438 14.7109 35.292 15.0214L27.5654 21.6225L29.8781 31.4462C29.9833 31.8966 29.9482 32.3041 29.773 32.6687C29.5978 33.0332 29.3525 33.3361 29.0371 33.5772C28.7218 33.8184 28.3538 33.957 27.9333 33.993C27.5128 34.0291 27.1099 33.9251 26.7244 33.6812L17.9991 28.4835Z"
                        fill={
                          (reviewStats?.reviewStats?.avgRate || 0) >= 1
                            ? "#FFCC00"
                            : "#8E8E93"
                        }
                      />
                    </svg>

                    <div className="text-3xl font-semibold">
                      {reviewStats?.reviewStats?.avgRate || 0}
                    </div>
                  </div>
                  <div className="flex w-full items-center flex-col mt-6">
                    <div className="text-xl">
                      {reviewStats?.reviewStats?.totalReviews || 0}
                    </div>
                    <div className="text-md text-gray-500">Reviews</div>
                  </div>
                </div>

                <div className="border-l pl-6 flex flex-col w-full pr-2 gap-1">
                  <div className="flex justify-between gap-3 w-full">
                    <ReviewStar rate={5} />
                    <div className="text-md text-gray-600">
                      {reviewStats?.reviewStats?.star5 || 0}
                    </div>
                  </div>
                  <div className="flex justify-between gap-3 w-full">
                    <ReviewStar rate={4} />
                    <div className="text-md text-gray-600">
                      {reviewStats?.reviewStats?.star4 || 0}
                    </div>
                  </div>
                  <div className="flex justify-between gap-3 w-full">
                    <ReviewStar rate={3} />
                    <div className="text-md text-gray-600">
                      {reviewStats?.reviewStats?.star3 || 0}
                    </div>
                  </div>
                  <div className="flex justify-between gap-3 w-full">
                    <ReviewStar rate={2} />
                    <div className="text-md text-gray-600">
                      {reviewStats?.reviewStats?.star2 || 0}
                    </div>
                  </div>
                  <div className="flex justify-between gap-3 w-full">
                    <ReviewStar rate={1} />
                    <div className="text-md text-gray-600">
                      {reviewStats?.reviewStats?.star1 || 0}
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-2 pb-4 w-full">
                <div className="w-full flex flex-col gap-3">
                  {reviewList.map((itm) => {
                    const boundedRate = Math.max(
                      0,
                      Math.min(5, itm.rate || 0),
                    ) as 0 | 1 | 2 | 3 | 4 | 5;
                    return (
                      <div
                        key={`rev-${itm._id}`}
                        className="cust-review p-3 flex gap-3 items-start border rounded-lg"
                      >
                        <div className="h-[60px] w-[60px] rounded-md overflow-hidden bg-gray-200">
                          {!!itm.user?.profilePic ? (
                            <PhotoViewer src={itm.user?.profilePic}>
                              <img
                                alt="React Rendezvous"
                                loading="lazy"
                                decoding="async"
                                data-nimg="1"
                                className="h-auto w-auto object-cover transition-all hover:scale-105 aspect-[1/1] cursor-pointer"
                                src={itm.user?.profilePic}
                              />
                            </PhotoViewer>
                          ) : (
                            <div className="flex w-full h-full items-center justify-center">
                              {StringHelper.getInitials(
                                itm.user?.firstName || "",
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex gap-2 items-end">
                            <div className="cust-name text-lg font-medium">
                              {itm.user?.firstName} {itm.user?.lastName}
                            </div>
                            <div className="cust-name text-xs text-gray-500 pb-1">
                              {dayjs(itm.createdAt).format(
                                "DD MMM, YYYY hh:mm A",
                              )}
                            </div>
                          </div>

                          <ReviewStar rate={boundedRate} />

                          {!!itm.review?.trim().length && (
                            <div className="text-gray-500 text-sm mt-1">
                              {itm.review}
                            </div>
                          )}

                          {!!itm.images.length && (
                            <div className="flex gap-3 mt-1">
                              {itm.images.map((imgUrl, i) => (
                                <div
                                  key={`${itm._id}-img-${i}`}
                                  className="h-[40px] w-[40px] rounded-md"
                                >
                                  <PhotoViewer src={imgUrl}>
                                    <img
                                      alt="React Rendezvous"
                                      loading="lazy"
                                      decoding="async"
                                      data-nimg="1"
                                      className="h-auto w-auto object-cover transition-all hover:scale-105 aspect-[1/1] cursor-pointer"
                                      src={imgUrl}
                                    />
                                  </PhotoViewer>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {showMore && (
                    <Button
                      onClick={() =>
                        getMoreReview(result?.user?.foodTruck?._id || "", page)
                      }
                    >
                      Load more
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}

      {!!changeStatus && (
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure want to update the request to{" "}
                <b>{changeStatus === "APPROVED" ? "Approved" : "Rejected"}</b>{" "}
                of the vendor{" "}
                <b>
                  {`${result?.user.firstName} ${result?.user.lastName || ""}`.trim()}
                </b>
              </AlertDialogDescription>
              {changeStatus === "REJECTED" && (
                <>
                  <div className="w-full">
                    <Textarea
                      value={reason}
                      placeholder="Enter reason for the Rejection"
                      onChange={(e) => setReason(e.target.value || "")}
                    />
                  </div>
                </>
              )}
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setChangeStatus(null);
                  setReason("");
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={
                  changing ||
                  (changeStatus === "REJECTED" && !reason.trim().length)
                }
                onClick={() => onStatusChange()}
              >
                Yes, Change it
                {changing && (
                  <LoaderCircle size={16} className="animate-spin" />
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {!!changeFeature && (
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure want to{" "}
                {changeFeature.foodTruck?.featured ? (
                  <>
                    remove this from <b>featured</b> listing
                  </>
                ) : (
                  <>
                    mark it as <b>featured</b>
                  </>
                )}
                ?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setChangeFeature(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={changingFeature}
                onClick={() => onFeatureChange()}
              >
                {changeFeature.foodTruck?.featured
                  ? "Yes, Remove it"
                  : "Yes, Mark it"}
                {changingFeature && (
                  <LoaderCircle size={16} className="animate-spin" />
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}

const ReviewStar = ({ rate }: { rate: 0 | 1 | 2 | 3 | 4 | 5 }) => {
  return (
    <svg
      width="119"
      height="20"
      viewBox="0 0 119 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9.67249 14.2057L6.3637 16.1989C6.21753 16.2919 6.06472 16.3318 5.90526 16.3185C5.7458 16.3052 5.60627 16.2521 5.48668 16.1591C5.36708 16.066 5.27406 15.9499 5.20762 15.8106C5.14118 15.6714 5.12789 15.5151 5.16776 15.3418L6.04478 11.5746L3.11472 9.04319C2.98183 8.92359 2.89891 8.78726 2.86596 8.63417C2.833 8.48109 2.84284 8.33173 2.89546 8.18609C2.94808 8.04045 3.02781 7.92086 3.13465 7.82731C3.24149 7.73376 3.38766 7.67396 3.57316 7.64792L7.44005 7.30907L8.93499 3.76109C9.00143 3.60163 9.10455 3.48204 9.24434 3.40231C9.38413 3.32258 9.52685 3.28271 9.67249 3.28271C9.81813 3.28271 9.96084 3.32258 10.1006 3.40231C10.2404 3.48204 10.3435 3.60163 10.41 3.76109L11.9049 7.30907L15.7718 7.64792C15.9578 7.67449 16.104 7.73429 16.2103 7.82731C16.3166 7.92033 16.3964 8.03992 16.4495 8.18609C16.5027 8.33226 16.5128 8.48189 16.4798 8.63497C16.4469 8.78805 16.3637 8.92413 16.2303 9.04319L13.3002 11.5746L14.1772 15.3418C14.2171 15.5146 14.2038 15.6709 14.1374 15.8106C14.0709 15.9504 13.9779 16.0666 13.8583 16.1591C13.7387 16.2516 13.5992 16.3047 13.4397 16.3185C13.2803 16.3323 13.1274 16.2925 12.9813 16.1989L9.67249 14.2057Z"
        fill={rate >= 1 ? "#FFCC00" : "#8E8E93"}
      />
      <path
        d="M34.3888 14.2057L31.08 16.1989C30.9338 16.2919 30.781 16.3318 30.6216 16.3185C30.4621 16.3052 30.3226 16.2521 30.203 16.1591C30.0834 16.066 29.9904 15.9499 29.9239 15.8106C29.8575 15.6714 29.8442 15.5151 29.8841 15.3418L30.7611 11.5746L27.831 9.04319C27.6981 8.92359 27.6152 8.78726 27.5823 8.63417C27.5493 8.48109 27.5591 8.33173 27.6118 8.18609C27.6644 8.04045 27.7441 7.92086 27.851 7.82731C27.9578 7.73376 28.104 7.67396 28.2895 7.64792L32.1564 7.30907L33.6513 3.76109C33.7177 3.60163 33.8209 3.48204 33.9606 3.40231C34.1004 3.32258 34.2432 3.28271 34.3888 3.28271C34.5344 3.28271 34.6772 3.32258 34.8169 3.40231C34.9567 3.48204 35.0599 3.60163 35.1263 3.76109L36.6212 7.30907L40.4881 7.64792C40.6742 7.67449 40.8203 7.73429 40.9266 7.82731C41.0329 7.92033 41.1127 8.03992 41.1658 8.18609C41.219 8.33226 41.2291 8.48189 41.1961 8.63497C41.1632 8.78805 41.08 8.92413 40.9466 9.04319L38.0165 11.5746L38.8935 15.3418C38.9334 15.5146 38.9201 15.6709 38.8537 15.8106C38.7872 15.9504 38.6942 16.0666 38.5746 16.1591C38.455 16.2516 38.3155 16.3047 38.156 16.3185C37.9966 16.3323 37.8438 16.2925 37.6976 16.1989L34.3888 14.2057Z"
        fill={rate >= 2 ? "#FFCC00" : "#8E8E93"}
      />
      <path
        d="M59.1049 14.2057L55.7961 16.1989C55.6499 16.2919 55.4971 16.3318 55.3376 16.3185C55.1782 16.3052 55.0386 16.2521 54.919 16.1591C54.7995 16.066 54.7064 15.9499 54.64 15.8106C54.5736 15.6714 54.5603 15.5151 54.6001 15.3418L55.4772 11.5746L52.5471 9.04319C52.4142 8.92359 52.3313 8.78726 52.2983 8.63417C52.2654 8.48109 52.2752 8.33173 52.3278 8.18609C52.3805 8.04045 52.4602 7.92086 52.567 7.82731C52.6739 7.73376 52.82 7.67396 53.0055 7.64792L56.8724 7.30907L58.3674 3.76109C58.4338 3.60163 58.5369 3.48204 58.6767 3.40231C58.8165 3.32258 58.9592 3.28271 59.1049 3.28271C59.2505 3.28271 59.3932 3.32258 59.533 3.40231C59.6728 3.48204 59.7759 3.60163 59.8424 3.76109L61.3373 7.30907L65.2042 7.64792C65.3902 7.67449 65.5364 7.73429 65.6427 7.82731C65.749 7.92033 65.8287 8.03992 65.8819 8.18609C65.935 8.33226 65.9451 8.48189 65.9122 8.63497C65.8792 8.78805 65.796 8.92413 65.6626 9.04319L62.7326 11.5746L63.6096 15.3418C63.6495 15.5146 63.6362 15.6709 63.5697 15.8106C63.5033 15.9504 63.4103 16.0666 63.2907 16.1591C63.1711 16.2516 63.0315 16.3047 62.8721 16.3185C62.7126 16.3323 62.5598 16.2925 62.4136 16.1989L59.1049 14.2057Z"
        fill={rate >= 3 ? "#FFCC00" : "#8E8E93"}
      />
      <path
        d="M83.8217 14.2057L80.5129 16.1989C80.3667 16.2919 80.2139 16.3318 80.0544 16.3185C79.895 16.3052 79.7554 16.2521 79.6358 16.1591C79.5163 16.066 79.4232 15.9499 79.3568 15.8106C79.2904 15.6714 79.2771 15.5151 79.3169 15.3418L80.194 11.5746L77.2639 9.04319C77.131 8.92359 77.0481 8.78726 77.0151 8.63417C76.9822 8.48109 76.992 8.33173 77.0446 8.18609C77.0973 8.04045 77.177 7.92086 77.2838 7.82731C77.3907 7.73376 77.5368 7.67396 77.7223 7.64792L81.5892 7.30907L83.0842 3.76109C83.1506 3.60163 83.2537 3.48204 83.3935 3.40231C83.5333 3.32258 83.676 3.28271 83.8217 3.28271C83.9673 3.28271 84.11 3.32258 84.2498 3.40231C84.3896 3.48204 84.4927 3.60163 84.5592 3.76109L86.0541 7.30907L89.921 7.64792C90.107 7.67449 90.2532 7.73429 90.3595 7.82731C90.4658 7.92033 90.5455 8.03992 90.5987 8.18609C90.6518 8.33226 90.6619 8.48189 90.629 8.63497C90.596 8.78805 90.5128 8.92413 90.3794 9.04319L87.4494 11.5746L88.3264 15.3418C88.3663 15.5146 88.353 15.6709 88.2865 15.8106C88.2201 15.9504 88.1271 16.0666 88.0075 16.1591C87.8879 16.2516 87.7483 16.3047 87.5889 16.3185C87.4294 16.3323 87.2766 16.2925 87.1304 16.1989L83.8217 14.2057Z"
        fill={rate >= 4 ? "#FFCC00" : "#8E8E93"}
      />
      <path
        d="M108.538 14.2057L105.229 16.1989C105.083 16.2919 104.93 16.3318 104.77 16.3185C104.611 16.3052 104.472 16.2521 104.352 16.1591C104.232 16.066 104.139 15.9499 104.073 15.8106C104.006 15.6714 103.993 15.5151 104.033 15.3418L104.91 11.5746L101.98 9.04319C101.847 8.92359 101.764 8.78726 101.731 8.63417C101.698 8.48109 101.708 8.33173 101.761 8.18609C101.813 8.04045 101.893 7.92086 102 7.82731C102.107 7.73376 102.253 7.67396 102.438 7.64792L106.305 7.30907L107.8 3.76109C107.867 3.60163 107.97 3.48204 108.11 3.40231C108.249 3.32258 108.392 3.28271 108.538 3.28271C108.683 3.28271 108.826 3.32258 108.966 3.40231C109.106 3.48204 109.209 3.60163 109.275 3.76109L110.77 7.30907L114.637 7.64792C114.823 7.67449 114.969 7.73429 115.076 7.82731C115.182 7.92033 115.262 8.03992 115.315 8.18609C115.368 8.33226 115.378 8.48189 115.345 8.63497C115.312 8.78805 115.229 8.92413 115.095 9.04319L112.165 11.5746L113.042 15.3418C113.082 15.5146 113.069 15.6709 113.003 15.8106C112.936 15.9504 112.843 16.0666 112.724 16.1591C112.604 16.2516 112.464 16.3047 112.305 16.3185C112.145 16.3323 111.993 16.2925 111.847 16.1989L108.538 14.2057Z"
        fill={rate >= 5 ? "#FFCC00" : "#8E8E93"}
      />
    </svg>
  );
};
