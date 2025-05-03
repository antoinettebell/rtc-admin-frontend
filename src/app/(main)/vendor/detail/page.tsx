"use client";
import {
  ArrowLeft,
  Check,
  LoaderCircle,
  MapPin,
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

export default function VendorDetail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("q");
  const [changeStatus, setChangeStatus] = useState<
    "APPROVED" | "REJECTED" | null
  >(null);
  const [changing, setChanging] = useState<boolean>(false);
  const [locations, setLocations] = useState<Record<string, string>>({});
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
    return 404;
  }

  const {
    data: result,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["vendor-detail"],
    queryFn: () =>
      userApiService.getById(id?.toString() || "").then((res) => {
        const loc: Record<string, string> = {};
        res.data?.data.user.foodTruck?.locations?.map((item) => {
          loc[item._id] = item.title;
        });
        setLocations(loc);
        return res;
      }),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const onStatusChange = () => {
    if (!id || !changeStatus) return;
    setChanging(true);
    userApiService
      .changeRequest(id, changeStatus)
      .then((res) => {
        setChangeStatus(null);
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

  return (
    <>
      <div className="flex justify-between flex-wrap mb-2">
        <div className="font-semibold text-[28px] leading-[42px] mb-2 flex gap-3 items-center">
          <Button variant="outline" onClick={() => router.replace("/vendor")}>
            <ArrowLeft /> Back
          </Button>
          Vendor Detail
        </div>

        {!isFetching && (
          <div className="flex gap-2">
            <Button
              variant="default"
              className="bg-green-500 hover:bg-green-600 font-semibold px-6"
              disabled={
                changing || result?.data.data.user.requestStatus === "APPROVED"
              }
              onClick={() => {
                setChangeStatus("APPROVED");
              }}
            >
              Approve
            </Button>
            <Button
              variant="default"
              className="bg-red-500 hover:bg-red-600 font-semibold px-6"
              disabled={
                changing || result?.data.data.user.requestStatus === "REJECTED"
              }
              onClick={() => {
                setChangeStatus("REJECTED");
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

      {!!result?.data.data.user && !isFetching && (
        <>
          <div className="border p-2 flex gap-3 rounded w-fit min-w-[350px] mb-2">
            <div className="border p-2 rounded h-fit">
              <SquareUserRound size={30} />
            </div>
            <div className="w-full">
              <h3 className="font-medium leading-none mt-1 mb-1 w-auto">
                Vendor:{" "}
                <b>
                  {`${result?.data.data.user.firstName} ${result?.data.data.user.lastName || ""}`.trim()}
                </b>
              </h3>
              <p className="text-sm text-muted-foreground">
                Truck: <b>{result.data.data.user.foodTruck?.name}</b>
              </p>
              <div className="flex justify-end w-full mt-1">
                <Status
                  status={result?.data.data.user.requestStatus}
                  className="!py-1.5"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-4 pt-2 pb-4">
            <div className="space-y-3 w-[190px]">
              <span data-state="closed">
                <div className="overflow-hidden rounded-md">
                  {result.data.data.user.foodTruck?.logo ? (
                          <div className="border rounded overflow-hidden">
                    <img
                      alt="React Rendezvous"
                      loading="lazy"
                      width="190"
                      height="250"
                      decoding="async"
                      data-nimg="1"
                      className="h-auto w-auto object-cover transition-all hover:scale-105 aspect-[3/4]"
                      src={result.data.data.user.foodTruck?.logo}
                    /></div>
                  ) : (
                    <div className="bg-gray-200 w-[190px] h-[250px]"></div>
                  )}
                </div>
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.data.data.user.foodTruck?.photos.map((item, i) => (
                <div className="space-y-3 w-[100px]" key={`${i}-truck-photo`}>
                  <span data-state="closed">
                    <div className="overflow-hidden rounded-md border">
                      <img
                        loading="lazy"
                        width="150"
                        height="150"
                        decoding="async"
                        data-nimg="1"
                        className="h-auto w-auto object-cover transition-all hover:scale-105 aspect-square"
                        src={item}
                      />
                    </div>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="border-b"></div>
          <div className="pt-2 pb-4">
            <div className="py-2 text-xl font-semibold">Cuisines</div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 5xl:grid-cols-4 gap-4 *:data-[slot=card]:shadow-xs *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card">
              {result.data.data.user.foodTruck?.cuisine.map((item, i) => (
                <div
                  key={`${i}-cui`}
                  className="border rounded-md px-3 py-2 flex items-center gap-2"
                >
                  <div className="rounded h-2 w-2 bg-green-500"></div>
                  {item.name}
                </div>
              ))}
            </div>
          </div>
          <div className="border-b"></div>
          <div className="pt-2 pb-4">
            <div className="py-2 text-xl font-semibold">Locations</div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 5xl:grid-cols-3 gap-4 *:data-[slot=card]:shadow-xs *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card">
              {result.data.data.user.foodTruck?.locations.map((item, i) => (
                <div
                  key={`${i}-location`}
                  className="border rounded-md px-3 py-2 flex items-center gap-3"
                >
                  <div>
                    <MapPin className="text-primary" />
                  </div>
                  <div className="w-full pr-[24px]">
                    <div className="font-semibold truncate">{item.title}</div>
                    <div className="font-medium text-sm truncate">
                      {item.address}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="border-b"></div>
          <div className="pt-2 pb-4">
            <div className="py-2 text-xl font-semibold">Availability</div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 5xl:grid-cols-3 gap-4 *:data-[slot=card]:shadow-xs *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card">
              {result.data.data.user.foodTruck?.availability.map((item, i) => (
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
                            {item.startTime}
                          </span>
                        </div>
                        <div>
                          Close{" "}
                          <span className="font-semibold">{item.endTime}</span>
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
              ))}
            </div>
          </div>
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
                  {`${result?.data.data.user.firstName} ${result?.data.data.user.lastName || ""}`.trim()}
                </b>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setChangeStatus(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={changing}
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
    </>
  );
}
