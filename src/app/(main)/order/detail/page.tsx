"use client";
import {
  ArrowLeft,
  CookingPot,
  MapPin,
  SquareUserRound,
  Truck,
  User2,
} from "lucide-react";
import * as React from "react";
import { Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { orderApiService } from "@/services/order-api-service";
import { OrderItem } from "@/interfaces/user-interface";
import dayjs from "dayjs";
import PhotoViewer from "@/components/ui/photo-viewer";

export default function OrderDetail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("q");

  if (!id) {
    return 404;
  }

  const {
    data: result,
    isFetching,
    refetch,
  } = useQuery<OrderItem>({
    queryKey: ["order-detail"],
    queryFn: () =>
      orderApiService.getById(id?.toString() || "").then((res) => {
        return res?.data?.data?.order;
      }),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  return (
    <>
      <div className="flex justify-between flex-wrap mb-2">
        <div className="font-semibold text-[28px] leading-[42px] mb-2 flex gap-3 items-center">
          <Button variant="outline" onClick={() => router.replace("/order")}>
            <ArrowLeft /> Back
          </Button>
          Order Detail{" "}
          {!!result && !isFetching && (
            <span className="italic text-gray-500 font-medium">[#{result.orderNumber || result._id}]</span>
          )}
        </div>
      </div>

      {isFetching && (
        <div>
          <div className="flex gap-3 flex-wrap mb-2">
            <Skeleton className="w-[300px] h-[200px]" />
            <Skeleton className="w-[300px] h-[200px]" />
            <Skeleton className="w-[300px] h-[200px]" />
          </div>
          <Skeleton className="h-4 mb-2" />
          <Skeleton className="h-4 mb-2" />
          <Skeleton className="h-4 mb-2" />
        </div>
      )}

      {!!result && !isFetching && (
        <>
          <div className="flex gap-3 flex-wrap mb-2">
            <div className="border w-fit rounded-xl p-1 bg-gray-100">
              <div className="px-2 py-1 text-base font-bold text-gray-600">
                Customer
              </div>
              <div className="p-2 flex gap-3 rounded-md w-fit min-w-[350px] bg-white">
                <div className="h-12 w-12 border rounded overflow-hidden flex items-center justify-center">
                  {result.user.profilePic ? (
                    <PhotoViewer src={result.user.profilePic}>
                      <img
                        className="h-auto w-auto object-cover transition-all hover:scale-105 aspect-square cursor-pointer"
                        src={result.user.profilePic}
                      />
                    </PhotoViewer>
                  ) : (
                    <User2 size={30} />
                  )}
                </div>
                <div className="w-full">
                  <h3 className="font-medium leading-none mt-1 mb-1 w-auto">
                    <b>
                      {`${result?.user.firstName} ${result?.user.lastName || ""}`.trim()}
                    </b>
                  </h3>
                  <p className="text-sm text-muted-foreground mb-1">
                    {result?.user.email}
                  </p>
                </div>
              </div>
            </div>
            <div className="border w-fit rounded-xl p-1 bg-gray-100">
              <div className="px-2 py-1 text-base font-bold text-gray-600">
                Vendor
              </div>
              <div className="p-2 flex gap-3 rounded-md w-fit min-w-[350px] bg-white">
                <div className="h-12 w-12 border rounded overflow-hidden flex items-center justify-center">
                  {result.vendor.profilePic ? (
                    <PhotoViewer src={result.user.profilePic}>
                      <img
                        className="h-auto w-auto object-cover transition-all hover:scale-105 aspect-square cursor-pointer"
                        src={result.user.profilePic}
                      />
                    </PhotoViewer>
                  ) : (
                    <SquareUserRound size={30} />
                  )}
                </div>
                <div className="w-full">
                  <h3 className="font-medium leading-none mt-1 mb-1 w-auto">
                    <b>
                      {`${result?.vendor.firstName} ${result?.vendor.lastName || ""}`.trim()}
                    </b>
                  </h3>
                  <p className="text-sm text-muted-foreground mb-1">
                    {result?.vendor.email}
                  </p>
                </div>
              </div>
            </div>
            <div className="border w-fit rounded-xl p-1 bg-gray-100">
              <div className="px-2 py-1 text-base font-bold text-gray-600">
                Food Truck
              </div>
              <div className="p-2 flex gap-3 rounded-md w-fit min-w-[350px] bg-white">
                <div className="h-12 w-12 border rounded overflow-hidden flex items-center justify-center">
                  {result.foodTruck.logo || result.foodTruck.photos[0] ? (
                    <PhotoViewer
                      src={result.foodTruck.logo || result.foodTruck.photos[0]}
                    >
                      <img
                        className="h-auto w-auto object-cover transition-all hover:scale-105 aspect-square cursor-pointer"
                        src={
                          result.foodTruck.logo || result.foodTruck.photos[0]
                        }
                      />
                    </PhotoViewer>
                  ) : (
                    <Truck size={30} />
                  )}
                </div>
                <div className="w-full">
                  <h3 className="font-medium leading-none mt-1 mb-1 w-auto capitalize">
                    <b>{`${result?.foodTruck.name}`.trim()}</b>
                  </h3>
                  <p className="text-sm text-muted-foreground mb-1 capitalize">
                    {result?.foodTruck.infoType}
                  </p>
                </div>
              </div>
            </div>
          </div>
          {!!result.locationId && (
            <>
              <div className="flex items-center gap-3 mt-3">
                <div className="whitespace-nowrap font-semibold text-xl">
                  Pickup Location
                </div>
                <div className="border-b w-full"></div>
              </div>
              <div className="pt-2 pb-4">
                {result.foodTruck?.locations.map((item, i) => (
                  <Fragment key={`${i}-location`}>
                    {item._id === result.locationId && (
                      <div className="border rounded-md px-3 py-2 flex items-center gap-3 w-fit">
                        <div>
                          <MapPin className="text-primary" />
                        </div>
                        <div className="w-full pr-[24px]">
                          <div className="font-semibold truncate">
                            {item.title}
                          </div>
                          <div className="font-medium text-sm">
                            {item.address}
                          </div>
                        </div>
                      </div>
                    )}
                  </Fragment>
                ))}
              </div>
            </>
          )}
          <div className="flex items-center gap-3 mt-3">
            <div className="whitespace-nowrap font-semibold text-xl">
              Details
            </div>
            <div className="border-b w-full"></div>
          </div>
          <div className="w-full flex gap-3 justify-between py-3 pr-1 max-w-[50rem]">
            <div className="text-md">
              Order Date:{" "}
              <b>{dayjs(result.createdAt).format("DD MMM, YYYY hh:mm A")}</b>
            </div>
            <div className="text-md">
              Time Est: <b>{result.deliveryTime}</b>
            </div>
            <div className="text-md">
              Status:{" "}
              <b className="text-primary capitalize">
                {result.orderStatus.toLowerCase()}
              </b>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <div className="whitespace-nowrap font-semibold text-xl">
              Order items
            </div>
            <div className="border-b w-full"></div>
          </div>
          <div className="pt-2 pb-4">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="bg-gray-100 w-[50%] text-start p-2 pl-4">
                    Item
                  </th>
                  <th className="bg-gray-100 p-2">price</th>
                  <th className="bg-gray-100 p-2">Quantity</th>
                  <th className="bg-gray-100 w-[230px] pr-4 text-end">Total</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((item, inx) => (
                  <tr key={`orderItem-${inx}`}>
                    <td className="text-start w-[50%] p-2 border-b pl-4">
                      <div className="flex w-full gap-3">
                        <div className="h-12 w-12 border rounded overflow-hidden flex items-center justify-center">
                          {!!item.menuItem?.imgUrls[0] ? (
                            <PhotoViewer src={item.menuItem?.imgUrls[0]}>
                              <img
                                className="h-auto w-auto object-cover transition-all hover:scale-105 aspect-square cursor-pointer"
                                src={item.menuItem?.imgUrls[0]}
                              />
                            </PhotoViewer>
                          ) : (
                            <CookingPot size={30} />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium leading-none mt-1 mb-1 w-auto truncate">
                            <b>{item.menuItem?.name}</b>
                          </h3>
                          <p className="text-sm text-muted-foreground mb-1 truncate">
                            {item.menuItem?.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-2 border-b text-center">
                      ${Number(item.price).toFixed(2)}
                    </td>
                    <td className="p-2 border-b text-center">{item.qty}</td>
                    <td className="p-2 border-b w-[230px] text-end pr-4">
                      ${Number(item.total).toFixed(2)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3}></td>
                  <td className="p-2 border-b w-[230px] font-medium text-end pr-4">
                    <div className="flex justify-between">
                      Subtotal:{" "}
                      <b className="ml-2">
                        ${Number(result.subTotal || 0).toFixed(2)}
                      </b>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td colSpan={3}></td>
                  <td className="p-2 border-b w-[230px] font-medium text-end pr-4">
                    <div className="flex justify-between">
                      Discount:{" "}
                      <b className="ml-2">
                        ${Number(result.discount || 0).toFixed(2)}
                      </b>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td colSpan={3}></td>
                  <td className="p-2 border-b w-[230px] font-medium text-end pr-4">
                    <div className="flex justify-between">
                      Tax:{" "}
                      <b className="ml-2">
                        ${Number(result.taxAmount || 0).toFixed(2)}
                      </b>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td colSpan={3}></td>
                  <td className="p-2 border-b w-[230px] font-medium text-end pr-4">
                    <div className="flex justify-between">
                      Total:{" "}
                      <b className="ml-2">
                        ${Number(result.total || 0).toFixed(2)}
                      </b>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
