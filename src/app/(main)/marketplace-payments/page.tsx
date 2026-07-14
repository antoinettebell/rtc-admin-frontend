"use client";

import * as React from "react";
import { useState } from "react";
import dayjs from "dayjs";
import { CheckCircle2, PhoneCall } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Column, DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MarketplacePayment,
  MarketplacePaymentStatus,
  marketplaceApiService,
} from "@/services/marketplace-api-service";

const money = (value?: number | null) => `$${Number(value || 0).toFixed(2)}`;

const paymentTypeLabels: Record<string, string> = {
  COORDINATOR_AWARD_FEE: "Coordinator Award Fee",
  VENDOR_EVENT_FEE: "Vendor Event Fee",
  FINAL_EVENT_PAYMENT: "Final Event Payment",
};

export default function MarketplacePaymentsPage() {
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [status, setStatus] = useState<MarketplacePaymentStatus | "ALL">(
    "PENDING",
  );
  const [paymentType, setPaymentType] = useState("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data: result, isFetching, refetch } = useQuery({
    queryKey: [
      "marketplace-payments",
      pagination.page,
      pagination.limit,
      status,
      paymentType,
    ],
    queryFn: () =>
      marketplaceApiService.listPayments({
        page: pagination.page,
        limit: pagination.limit,
        payment_status: status === "ALL" ? undefined : status,
        payment_type: paymentType === "ALL" ? undefined : paymentType,
      }),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const markPaid = async (payment: MarketplacePayment) => {
    const reference =
      window.prompt("Payment reference note, if available") || "";
    const note = window.prompt(
      "Payment source note",
      "phone payment processed externally",
    );
    if (!note?.trim()) return;

    setUpdatingId(payment.payment_id);
    try {
      await marketplaceApiService.markPaymentPaid(payment.payment_id, {
        manual_payment_reference: reference.trim(),
        manual_payment_note: note.trim(),
      });
      toast.success("Marketplace payment marked paid");
      refetch();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Unable to mark payment paid",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const columns: Column<MarketplacePayment>[] = [
    {
      header: "Payment",
      fieldName: "payment_id",
      accessor: (payment) => (
        <div className="min-w-[210px]">
          <div className="font-medium">{payment.payment_id}</div>
          <div className="text-xs text-muted-foreground">
            {paymentTypeLabels[payment.payment_type] || payment.payment_type}
          </div>
        </div>
      ),
      canNotHide: true,
    },
    {
      header: "Event",
      fieldName: "event_id",
      accessor: (payment) => (
        <div>
          <div>{payment.marketplaceEvent?.event_name || "-"}</div>
          <div className="text-xs text-muted-foreground">{payment.event_id}</div>
        </div>
      ),
    },
    {
      header: "Bid",
      fieldName: "bid_id",
      accessor: (payment) => payment.bid_id || "-",
    },
    {
      header: "Payer",
      fieldName: "payer_user_id",
      accessor: (payment) => (
        <div className="text-xs">
          <div>{payment.payer_type}: {payment.payer_user_id}</div>
          <div>Truck: {payment.food_truck_id || "-"}</div>
        </div>
      ),
    },
    {
      header: "Amount",
      fieldName: "total_amount",
      accessor: (payment) => (
        <div>
          <div className="font-medium">{money(payment.total_amount)}</div>
          <div className="text-xs text-muted-foreground">
            Base {money(payment.base_amount)}
          </div>
          {Number(payment.tip_amount || 0) > 0 ? (
            <div className="text-xs text-muted-foreground">
              Tip {money(payment.tip_amount)}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      header: "Method",
      fieldName: "payment_method",
      accessor: (payment) => payment.payment_method || "Awaiting payer",
    },
    {
      header: "Status",
      fieldName: "payment_status",
      accessor: (payment) => (
        <span className="rounded-full border px-2 py-1 text-xs font-medium">
          {payment.payment_status}
        </span>
      ),
    },
    {
      header: "Created",
      fieldName: "created_at",
      accessor: (payment) =>
        payment.created_at
          ? dayjs(payment.created_at).format("YYYY-MM-DD HH:mm")
          : "-",
    },
  ];

  const payments = result?.data?.data?.records || [];
  const total = result?.data?.data?.total || 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Marketplace Payments</h1>
        <p className="text-sm text-muted-foreground">
          Verify pending marketplace wallet and phone payments. Admins can mark
          phone payments paid after external processing only.
        </p>
      </div>

      <DataTable
        data={payments}
        columns={columns}
        isLoading={isFetching}
        totalRecords={total}
        currentPage={pagination.page}
        pageSize={pagination.limit}
        setPagination={setPagination}
        extraTemplate={
          <div className="flex flex-wrap gap-2">
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value as MarketplacePaymentStatus | "ALL");
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select
              value={paymentType}
              onValueChange={(value) => {
                setPaymentType(value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              <SelectTrigger className="w-[230px]">
                <SelectValue placeholder="Payment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="ALL">All payment types</SelectItem>
                  <SelectItem value="COORDINATOR_AWARD_FEE">
                    Coordinator award
                  </SelectItem>
                  <SelectItem value="VENDOR_EVENT_FEE">Vendor event fee</SelectItem>
                  <SelectItem value="FINAL_EVENT_PAYMENT">
                    Final event payment
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        }
        actions={(payment) => (
          <div className="flex min-w-[170px] flex-wrap gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled
              title="Phone payment is processed outside the app"
            >
              <PhoneCall className="mr-1 h-4 w-4" /> 800-410-7053
            </Button>
            <Button
              size="sm"
              disabled={
                updatingId === payment.payment_id ||
                payment.payment_status === "PAID"
              }
              onClick={() => markPaid(payment)}
            >
              <CheckCircle2 className="mr-1 h-4 w-4" /> Mark Paid
            </Button>
          </div>
        )}
      />
    </div>
  );
}
