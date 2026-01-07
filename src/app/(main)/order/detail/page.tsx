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
              Order Items
            </div>
            <div className="border-b w-full"></div>
          </div>
          <div className="pt-2 pb-4">
            {result.items.map((item, inx) => (
              <div key={`orderItem-${inx}`} className="mb-6 border rounded-lg p-4 bg-gray-50">
                {/* Main Item Header */}
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="font-semibold text-lg">Main Item</h4>
                  {item.menuItem?.discountType && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                      {item.menuItem.discountType} Offer
                    </span>
                  )}
                </div>
                
                {/* Main Item */}
                <div className="bg-white rounded-md p-3 mb-3">
                  <div className="flex justify-between items-center">
                    <div className="flex gap-3 flex-1">
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
                      <div className="flex-1">
                        <h3 className="font-medium leading-none mt-1 mb-1">
                          <b>{item.menuItem?.name}</b>
                        </h3>
                        <p className="text-sm text-muted-foreground mb-1">
                          {item.menuItem?.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-8 items-center">
                      <div className="text-center">
                        <div className="text-sm text-gray-500">Price</div>
                        <div className="font-medium">${Number(item.price).toFixed(2)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-500">Qty</div>
                        <div className="font-medium">{item.qty}</div>
                      </div>
                      <div className="text-center min-w-[80px]">
                        <div className="text-sm text-gray-500">Total</div>
                        <div className="font-medium">${Number(item.total).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* BOGO/BOGOHO Items Section */}
                {(item.menuItem?.discountType === 'BOGO' || item.menuItem?.discountType === 'BOGOHO') && item.menuItem?.bogoItems?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h5 className="font-medium text-green-700">
                        {item.menuItem.discountType === 'BOGO' ? 'Free Items (Buy One Get One)' : 'Half Price Items (Buy One Get One Half Off)'}
                      </h5>
                    </div>
                    {item?.menuItem?.bogoItems.map((bogoItem, bogoInx) => (
                      <div key={`bogoItem-${inx}-${bogoInx}`} className="bg-green-50 border border-green-200 rounded-md p-3 mb-2">
                        <div className="flex justify-between items-center">
                          <div className="flex gap-3 flex-1">
                            <div className="h-12 w-12 border rounded overflow-hidden flex items-center justify-center">
                              {!!bogoItem.imgUrls?.[0] ? (
                                <PhotoViewer src={bogoItem.imgUrls[0]}>
                                  <img
                                    className="h-auto w-auto object-cover transition-all hover:scale-105 aspect-square cursor-pointer"
                                    src={bogoItem.imgUrls[0]}
                                  />
                                </PhotoViewer>
                              ) : (
                                <CookingPot size={30} />
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium leading-none mt-1 mb-1">
                                <b>{bogoItem.name}</b>
                              </h3>
                              <p className="text-sm text-muted-foreground mb-1">
                                {bogoItem.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-8 items-center">
                            <div className="text-center">
                              <div className="text-sm text-gray-500">Price</div>
                              <div className="font-medium text-green-600">
                                {item?.menuItem?.discountType === 'BOGO' ? '$0.00' : `$${Number(bogoItem?.halfPrice || bogoItem.price / 2).toFixed(2)}`}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm text-gray-500">Qty</div>
                              <div className="font-medium">{bogoItem.qty}</div>
                            </div>
                            <div className="text-center min-w-[80px]">
                              <div className="text-sm text-gray-500">Total</div>
                              <div className="font-medium text-green-600">
                                {item?.menuItem?.discountType === 'BOGO' ? '$0.00' : `$${Number(bogoItem?.total || (bogoItem?.halfPrice || bogoItem?.price / 2) * bogoItem.qty).toFixed(2)}`}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {/* Order Summary */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-lg mb-3">Payment Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="font-medium capitalize">{result.paymentMethod || 'N/A'}</span>
                    </div>
                    {result.paymentMethod !== 'COD' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Payment Status:</span>
                          <span className={`font-medium capitalize ${
                            result.paymentStatus === 'PAID' ? 'text-green-600' : 
                            result.paymentStatus === 'PENDING' ? 'text-yellow-600' : 
                            result.paymentStatus === 'REFUNDED' ? 'text-orange-600' : 'text-red-600'
                          }`}>
                            {result.paymentStatus || 'N/A'}
                          </span>
                        </div>
                        {result.transactionId && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Transaction ID:</span>
                            <span className="font-medium text-sm">{result.transactionId}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  {/* Refund Information */}
                  {result.paymentStatus === 'REFUNDED' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h5 className="font-medium text-orange-700 mb-2">Refund Details</h5>
                      <div className="space-y-2 text-sm">
                        {result.refundTransactionId && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Refund Transaction ID:</span>
                            <span className="font-medium">{result.refundTransactionId}</span>
                          </div>
                        )}
                        {result.refundDateTime && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Refund Date:</span>
                            <span className="font-medium">{dayjs(result.refundDateTime).format("DD MMM, YYYY hh:mm A")}</span>
                          </div>
                        )}
                        {result.refundStatus && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Refund Status:</span>
                            <span className={`font-medium ${
                              result.refundStatus === 'SUCCESS' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {result.refundStatus}
                            </span>
                          </div>
                        )}
                        {result.refundMode && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Refund Mode:</span>
                            <span className="font-medium">{result.refundMode}</span>
                          </div>
                        )}
                        {result.refundReason && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Reason:</span>
                            <span className="font-medium">{result.refundReason}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Order Total Breakdown */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-lg mb-3">Order Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">${Number(result.subTotal || 0).toFixed(2)}</span>
                    </div>
                    {/* {result.discount > 0 && ( */}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Discount:</span>
                        <div className="text-right">
                          <span className="font-medium text-green-600">-${Number(result.discount || 0).toFixed(2)}</span>
                          {result.discountType && (
                            <div className="text-xs text-green-600 capitalize">{result.discountType} Applied</div>
                          )}
                        </div>
                      </div>
                    {/* // )} */}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax:</span>
                      <span className="font-medium">${Number(result.taxAmount || 0).toFixed(2)}</span>
                    </div>
                    {result.paymentProcessingFee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Processing Fee:</span>
                        <span className="font-medium">${Number(result.paymentProcessingFee || 0).toFixed(2)}</span>
                      </div>
                    )}
                    {result?.tipsAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tips Amount:</span>
                        <span className="font-medium">${Number(result?.tipsAmount || 0).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="font-semibold text-lg">Total:</span>
                        <span className="font-semibold text-lg">${Number(result.total || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
