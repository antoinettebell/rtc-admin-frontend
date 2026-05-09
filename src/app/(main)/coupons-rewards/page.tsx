"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { Archive, LoaderCircle, PlusCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Column, DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Coupon } from "@/interfaces/user-interface";
import {
  CouponPayload,
  couponApiService,
} from "@/services/coupon-api-service";
import { settingApiService } from "@/services/setting-api-service";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback/use-debounced-callback";

const emptyCouponForm = {
  code: "",
  type: "FIXED" as "FIXED" | "PERCENTAGE",
  value: "",
  maxDiscount: "",
  validFrom: "",
  validTill: "",
};

type CouponForm = typeof emptyCouponForm;

const money = (value?: number | null) => `$${Number(value || 0).toFixed(2)}`;

const couponStatus = (coupon: Coupon) => {
  if (coupon.status === "ARCHIVED" || !coupon.isActive) return "Archived";
  if (coupon.validTill && dayjs(coupon.validTill).endOf("day").isBefore(dayjs())) {
    return "Expired";
  }
  if (coupon.validFrom && dayjs(coupon.validFrom).startOf("day").isAfter(dayjs())) {
    return "Scheduled";
  }
  return "Active";
};

export default function CouponsRewards() {
  const [couponForm, setCouponForm] = useState(emptyCouponForm);
  const [couponLoading, setCouponLoading] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [searchTerm, setSearchTerm] = useState("");

  const [freeDessertAmount, setFreeDessertAmount] = useState("");
  const [freeDessertOrderCount, setFreeDessertOrderCount] = useState("");
  const [isFreeDessertEnabled, setIsFreeDessertEnabled] = useState(false);

  const {
    data: couponResult,
    isFetching: couponsFetching,
    refetch: refetchCoupons,
  } = useQuery({
    queryKey: ["coupon-list", pagination.page, pagination.limit, searchTerm],
    queryFn: () =>
      couponApiService.list(searchTerm, pagination.page, pagination.limit),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const { data: settingResult, refetch: refetchSettings } = useQuery({
    queryKey: ["coupon-rewards-setting"],
    queryFn: () => settingApiService.getFull(),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  React.useEffect(() => {
    const setting = settingResult?.data?.data?.setting;
    if (!setting) return;
    setFreeDessertAmount(
      typeof setting.freeDessertAmount === "number"
        ? String(setting.freeDessertAmount)
        : "",
    );
    setFreeDessertOrderCount(
      typeof setting.freeDessertOrderCount === "number"
        ? String(setting.freeDessertOrderCount)
        : "",
    );
    setIsFreeDessertEnabled(!!setting.isFreeDessertEnabled);
  }, [settingResult]);

  const coupons = useMemo(
    () => (couponResult?.data?.data?.records || []) as Coupon[],
    [couponResult],
  );

  const activeCoupon = useMemo(
    () => coupons.find((coupon) => couponStatus(coupon) === "Active"),
    [coupons],
  );

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setSearchTerm(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, 500);

  const updateCouponForm = (key: keyof CouponForm, value: string) => {
    setCouponForm((prev) => ({ ...prev, [key]: value }) as CouponForm);
  };

  const resetCouponForm = () => setCouponForm(emptyCouponForm);

  const saveCoupon = () => {
    const code = couponForm.code.trim().toUpperCase();
    const value = Number(couponForm.value);
    const maxDiscount = couponForm.maxDiscount.trim()
      ? Number(couponForm.maxDiscount)
      : null;

    if (code.length < 4) {
      toast.error("Coupon code must be at least 4 characters");
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Discount amount must be greater than 0");
      return;
    }
    if (couponForm.type === "PERCENTAGE" && value > 100) {
      toast.error("Percentage discount can not exceed 100%");
      return;
    }
    if (
      couponForm.type === "PERCENTAGE" &&
      maxDiscount !== null &&
      (!Number.isFinite(maxDiscount) || maxDiscount < 0)
    ) {
      toast.error("Max discount must be 0 or greater");
      return;
    }
    if (
      couponForm.validFrom &&
      couponForm.validTill &&
      dayjs(couponForm.validFrom).isAfter(dayjs(couponForm.validTill))
    ) {
      toast.error("Start date can not be after expiration date");
      return;
    }

    setCouponLoading(true);
    const couponPayload: CouponPayload = {
      code,
      type: couponForm.type,
      value,
      usageLimit: "NOLIMIT",
      fundedBy: "APP",
      validFrom: couponForm.validFrom || null,
      validTill: couponForm.validTill || null,
    };

    if (couponForm.type === "PERCENTAGE") {
      couponPayload.maxDiscount = maxDiscount;
    }

    couponApiService
      .create(couponPayload)
      .then(() => {
        toast.success("Coupon created");
        resetCouponForm();
        refetchCoupons();
      })
      .catch((e) => {
        toast.error(e.response?.data?.message || "Error while creating coupon");
      })
      .finally(() => setCouponLoading(false));
  };

  const archiveActiveCoupon = () => {
    setArchiveLoading(true);
    couponApiService
      .archiveActive()
      .then((res) => {
        const count = res.data?.data?.archivedCount || 0;
        toast.success(
          count > 0 ? "Active coupon archived" : "No active coupon to archive",
        );
        resetCouponForm();
        refetchCoupons();
      })
      .catch((e) => {
        toast.error(e.response?.data?.message || "Error while archiving coupon");
      })
      .finally(() => setArchiveLoading(false));
  };

  const archiveCoupon = (coupon: Coupon) => {
    if (!coupon._id) return;
    setArchiveLoading(true);
    couponApiService
      .update(coupon._id, { status: "ARCHIVED", isActive: false })
      .then(() => {
        toast.success("Coupon archived");
        refetchCoupons();
      })
      .catch((e) => {
        toast.error(e.response?.data?.message || "Error while archiving coupon");
      })
      .finally(() => setArchiveLoading(false));
  };

  const saveLoyaltyBucks = () => {
    const amount = Number(freeDessertAmount);
    const orderCount = Number(freeDessertOrderCount);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error("Loyalty bucks amount must be 0 or greater");
      return;
    }
    if (!Number.isFinite(orderCount) || orderCount < 1) {
      toast.error("Order count must be 1 or greater");
      return;
    }

    setLoyaltyLoading(true);
    settingApiService
      .updateFreeDessert({
        freeDessertAmount: amount,
        freeDessertOrderCount: orderCount,
        isFreeDessertEnabled,
      })
      .then(() => {
        toast.success("Free loyalty bucks settings updated");
        refetchSettings();
      })
      .catch((e) => {
        toast.error(e.response?.data?.message || "Error while updating");
      })
      .finally(() => setLoyaltyLoading(false));
  };

  const columns: Column<Coupon>[] = [
    {
      header: "Code",
      fieldName: "code",
      accessor: (coupon) => <span className="font-semibold">{coupon.code}</span>,
    },
    {
      header: "Discount",
      fieldName: "value",
      accessor: (coupon) =>
        coupon.type === "PERCENTAGE"
          ? `${Number(coupon.value || 0)}%`
          : money(coupon.value),
    },
    {
      header: "Max",
      fieldName: "maxDiscount",
      accessor: (coupon) =>
        coupon.type === "PERCENTAGE" && Number(coupon.maxDiscount || 0) > 0
          ? money(coupon.maxDiscount)
          : "-",
    },
    {
      header: "Status",
      fieldName: "status",
      accessor: (coupon) => {
        const status = couponStatus(coupon);
        const className =
          status === "Active"
            ? "bg-green-50 text-green-700"
            : status === "Expired"
              ? "bg-amber-50 text-amber-700"
              : status === "Scheduled"
                ? "bg-blue-50 text-blue-700"
                : "bg-slate-100 text-slate-700";
        return <Badge className={className}>{status}</Badge>;
      },
    },
    {
      header: "Used",
      fieldName: "usageCount",
      accessor: (coupon) => Number(coupon.usageCount || 0),
    },
    {
      header: "Last Used",
      fieldName: "lastUsedAt",
      accessor: (coupon) =>
        coupon.lastUsedAt ? dayjs(coupon.lastUsedAt).format("DD MMM, YYYY") : "-",
    },
    {
      header: "Expires",
      fieldName: "validTill",
      accessor: (coupon) =>
        coupon.validTill ? dayjs(coupon.validTill).format("DD MMM, YYYY") : "-",
    },
    {
      header: "Created",
      fieldName: "createdAt",
      accessor: (coupon) =>
        coupon.createdAt ? dayjs(coupon.createdAt).format("DD MMM, YYYY") : "-",
    },
    {
      header: "Action",
      fieldName: "_id",
      accessor: (coupon) =>
        couponStatus(coupon) === "Archived" ? (
          "-"
        ) : (
          <Button
            size="sm"
            variant="outline"
            disabled={archiveLoading}
            onClick={(event) => {
              event.stopPropagation();
              archiveCoupon(coupon);
            }}
          >
            <Archive size={14} className="mr-1" />
            Archive
          </Button>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="font-semibold text-[28px] leading-[42px]">
          Coupons & Rewards
        </div>
        <p className="text-sm text-muted-foreground">
          Manage app-funded customer coupons and recurring loyalty rewards.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
        <section className="rounded-md border bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">App Coupon</h2>
              <p className="text-sm text-muted-foreground">
                Create one-time marketing codes customers can enter in checkout.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={archiveLoading}
              onClick={archiveActiveCoupon}
            >
              {archiveLoading ? (
                <LoaderCircle size={16} className="mr-2 animate-spin" />
              ) : (
                <Archive size={16} className="mr-2" />
              )}
              Archive Active Coupon
            </Button>
          </div>

          {activeCoupon && (
            <div className="mt-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
              Current active coupon:{" "}
              <span className="font-semibold">{activeCoupon.code}</span>
            </div>
          )}

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Coupon Code</label>
              <Input
                value={couponForm.code}
                onChange={(e) => updateCouponForm("code", e.target.value)}
                placeholder="SAVE5"
                className="uppercase"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Discount Type</label>
              <Select
                value={couponForm.type}
                onValueChange={(value) =>
                  updateCouponForm("type", value as "FIXED" | "PERCENTAGE")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="FIXED">$ off</SelectItem>
                    <SelectItem value="PERCENTAGE">% off</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <Input
                type="number"
                min="0"
                value={couponForm.value}
                onChange={(e) => updateCouponForm("value", e.target.value)}
                placeholder={couponForm.type === "FIXED" ? "5.00" : "10"}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Discount</label>
              <Input
                type="number"
                min="0"
                disabled={couponForm.type !== "PERCENTAGE"}
                value={couponForm.maxDiscount}
                onChange={(e) => updateCouponForm("maxDiscount", e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={couponForm.validFrom}
                onChange={(e) => updateCouponForm("validFrom", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Expiration Date</label>
              <Input
                type="date"
                value={couponForm.validTill}
                onChange={(e) => updateCouponForm("validTill", e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2 md:col-span-2">
              <Button disabled={couponLoading} onClick={saveCoupon}>
                {couponLoading ? (
                  <LoaderCircle size={16} className="mr-2 animate-spin" />
                ) : (
                  <PlusCircle size={16} className="mr-2" />
                )}
                Create Coupon
              </Button>
              <Button variant="outline" onClick={resetCouponForm}>
                Clear
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-md border bg-white p-4">
          <h2 className="text-lg font-semibold">Free Loyalty Bucks</h2>
          <p className="text-sm text-muted-foreground">
            Reward customers after a set number of completed orders.
          </p>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium">Enable Rewards</label>
              <Switch
                checked={isFreeDessertEnabled}
                onCheckedChange={setIsFreeDessertEnabled}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reward Amount ($)</label>
              <Input
                type="number"
                min="0"
                value={freeDessertAmount}
                onChange={(e) => setFreeDessertAmount(e.target.value)}
                placeholder="5.00"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Order Count Threshold</label>
              <Input
                type="number"
                min="1"
                value={freeDessertOrderCount}
                onChange={(e) => setFreeDessertOrderCount(e.target.value)}
                placeholder="10"
              />
            </div>
            <Button disabled={loyaltyLoading} onClick={saveLoyaltyBucks}>
              {loyaltyLoading && (
                <LoaderCircle size={16} className="mr-2 animate-spin" />
              )}
              Save Rewards
            </Button>
          </div>
        </section>
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Coupon History</h2>
          <p className="text-sm text-muted-foreground">
            Active, archived, and expired app coupons appear here with usage
            totals.
          </p>
        </div>
        <DataTable
          columns={columns as any}
          data={coupons as any}
          totalRecords={couponResult?.data?.data?.total || 0}
          isLoading={couponsFetching}
          onSearch={(s: string) => debouncedSearch(s)}
          currentPage={pagination.page}
          pageSize={pagination.limit}
          setPagination={setPagination}
          hideColumnFilter={true}
        />
      </section>
    </div>
  );
}
