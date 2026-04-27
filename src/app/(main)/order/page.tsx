"use client";
import * as React from "react";
import { useState } from "react";
import { Column, DataTable } from "@/components/ui/data-table";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback/use-debounced-callback";
import { useQuery } from "@tanstack/react-query";
import { OrderItem } from "@/interfaces/user-interface";
import { NameDetail } from "@/components/ui/name-detail";
import { useRouter } from "next/navigation";
import { orderApiService } from "@/services/order-api-service";
import dayjs from "dayjs";

export default function Orders() {
  const router = useRouter();
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: result,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["order-list", pagination.page, pagination.limit, searchTerm],
    queryFn: () =>
      orderApiService
        .list(searchTerm, pagination.page, pagination.limit)
        .then((res) => res?.data?.data),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setSearchTerm(value);
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  }, 500);

  const columns: Column<OrderItem>[] = [
    {
      header: "Customer",
      fieldName: "user",
      accessor: (d) => (
        <NameDetail
          name={`${d.user.firstName} ${d.user.lastName || ""}`}
          email={d.user.email}
          imgSrc={d.user.profilePic || ""}
          avatarClassName={"object-contain"}
        />
      ),
      className: "!px-4 w-[270px]",
      canNotHide: true,
    },
    {
      header: "Vendor / Food Truck",
      fieldName: "vendor",
      accessor: (d) => (
        <NameDetail
          name={`${d.vendor.firstName} ${d.vendor.lastName || ""}`}
          email={d.vendor.email}
          imgSrc={d.vendor.profilePic || ""}
          avatarClassName={"object-contain"}
        />
      ),
      className: "!px-4 w-[270px]",
      canNotHide: true,
    },
    {
      header: "Items",
      fieldName: "items",
      accessor: (d) => (
        <div className="pr-2">
          <table>
            <tbody>
              {d.items.map((item, inx) => (
                <tr key={`orderItem-${inx}`}>
                  <td
                    className={`capitalize p-1 pr-1 ${inx + 1 === d.items.length ? "" : "border-b"} border-r`}
                  >
                    {inx + 1}
                  </td>
                  <td
                    className={`capitalize p-1 pr-1 font-semibold min-w-[100px] truncate ${inx + 1 === d.items.length ? "" : "border-b"} border-r`}
                  >
                    {item?.menuItem?.name}
                  </td>
                  <td
                    className={`capitalize p-1 min-w-[100px] ${inx + 1 === d.items.length ? "" : "border-b"} border-r`}
                  >
                    {item?.menuItem?.discountType === "BOGOHO" ? (
                      <div>
                        <div>${Number(item?.menuItem?.price).toFixed(2)} * {item?.qty}</div>
                        {item?.menuItem?.bogoItems?.map((bogoItem, bogoInx) => (
                          <div key={bogoInx} className="text-sm text-gray-600">
                            + ${Number(bogoItem.halfPrice).toFixed(2)} * {bogoItem.qty} (Half Price)
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span>${Number(item?.menuItem?.price).toFixed(2)} * {item?.qty}</span>
                    )}
                  </td>
                  <td
                    className={`capitalize p-1 ${inx + 1 === d.items.length ? "" : "border-b"}`}
                  >
                    {item?.menuItem?.discountType === "BOGOHO" ? (
                      <div>
                        <div>${Number(item.total).toFixed(2)}</div>
                        <div className="text-xs text-gray-500">
                           + ${
                            Number(item?.menuItem?.bogoItems?.reduce((sum, bogoItem) => sum + (bogoItem.total || 0), 0) || 0).toFixed(2)
                          }
                          {/* (${Number(item?.menuItem?.price * item?.qty).toFixed(2)} + ${
                            Number(item?.menuItem?.bogoItems?.reduce((sum, bogoItem) => sum + (bogoItem.total || 0), 0) || 0).toFixed(2)
                          }) */}
                        </div>
                      </div>
                    ) : (
                      <span>${Number(item.total).toFixed(2)}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    },
    {
      header: "Sub Total",
      fieldName: "subTotal",
      className: "w-[150px]",
      accessor: (d) => (
        <span className="font-semibold">${Number(d.subTotal).toFixed(2)}</span>
      ),
    },
     {
      header: "Payment Processing Fee",
      fieldName: "paymentProcessingFee",
      className: "w-[150px]",
      accessor: (d) => (
        <span className="font-semibold">${Number(d?.paymentProcessingFee).toFixed(2)}</span>
      ),
    },
    {
      header: "Discount",
      fieldName: "discount",
      className: "w-[150px]",
      accessor: (d) => (
        <span className="font-semibold">${Number(d.discount).toFixed(2)}</span>
      ),
    },
    {
      header: "Fees / Tips",
      fieldName: "deliveryFee",
      className: "w-[190px]",
      accessor: (d) => {
        const driverTip = Number(d.tip ?? d.tips ?? 0);
        const foodTruckTip = Number(d.tipsAmount || 0);
        const deliveryFee = Number(d.deliveryFee || 0);

        return (
          <div className="text-sm leading-6">
            <div>Delivery: ${deliveryFee.toFixed(2)}</div>
            <div>Driver Tip: ${driverTip.toFixed(2)}</div>
            <div>Truck Tip: ${foodTruckTip.toFixed(2)}</div>
          </div>
        );
      },
    },
    {
      header: "Total",
      fieldName: "total",
      className: "w-[150px]",
      accessor: (d) => (
        <span className="font-semibold">${Number(d.total).toFixed(2)}</span>
      ),
    },
    {
      header: "Date",
      fieldName: "createdAt",
      className: "w-[400px]",
      accessor: (d) => (
        <span className="">
          {dayjs(d.createdAt).format("DD MMM, YYYY hh:mm A")}
        </span>
      ),
    },
    {
      header: "Status",
      fieldName: "orderStatus",
      accessor: (d) => (
        <span className="text-primary capitalize font-bold">
          {d.orderStatus?.toLowerCase()}
        </span>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-between">
        <div className="font-semibold text-[28px] leading-[42px] mb-2">
          Orders
        </div>
      </div>
      <DataTable
        columns={columns as any}
        data={(result?.records || []) as any}
        totalRecords={result?.total || 0}
        isLoading={isFetching}
        onSearch={(s: string) => debouncedSearch(s)}
        currentPage={pagination.page}
        pageSize={pagination.limit}
        setPagination={setPagination}
        hideColumnFilter={true}
        onRowClick={(d) => router.push(`/order/detail?q=${d._id}`)}
      />
    </>
  );
}
