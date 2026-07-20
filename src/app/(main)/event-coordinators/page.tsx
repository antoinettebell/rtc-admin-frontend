"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import Image from "next/image";
import { Column, DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { NameDetail } from "@/components/ui/name-detail";
import { userApiService } from "@/services/user-api-service";
import { User } from "@/interfaces/user-interface";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback/use-debounced-callback";
import { useRouter, useSearchParams } from "next/navigation";

const PAYMENT_LABELS: Record<string, string> = {
  CASHAPP: "Cash App",
  ZELLE: "Zelle",
  PAYPAL: "PayPal",
  VENMO: "Venmo",
  DIRECT_DEPOSIT: "Direct Deposit",
};

const compactAddress = (user: User) =>
  [
    user.eventCoordinatorAddressLine1,
    user.eventCoordinatorAddressLine2,
    user.eventCoordinatorAddressCity,
    user.eventCoordinatorAddressState,
    user.eventCoordinatorAddressZip,
  ]
    .filter(Boolean)
    .join(", ") ||
  user.eventCoordinatorFormattedAddress ||
  user.eventCoordinatorCompanyAddress ||
  "-";

export default function EventCoordinators() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    params.set("p", String(pagination.page));
    params.set("l", String(pagination.limit));
    router.replace(`/event-coordinators?${params.toString()}`);
  }, [pagination.page, pagination.limit, status, router]);

  useEffect(() => {
    const st = searchParams.get("status");
    setStatus(st === "enabled" || st === "disabled" ? st : "all");
  }, [searchParams]);

  const {
    data: result,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: [
      "event-coordinator-list",
      pagination.page,
      pagination.limit,
      searchTerm,
      status,
    ],
    queryFn: () =>
      userApiService.listEventCoordinators(
        pagination.page,
        status === "all" ? "" : status,
        searchTerm,
        pagination.limit,
      ),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setSearchTerm(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, 500);

  const changeCoordinatorStatus = (user: User, enabled: boolean) => {
    setUpdatingId(user._id);
    userApiService
      .changeEventCoordinatorStatus(user._id, enabled)
      .then(() => {
        toast.success("Event coordinator access updated.");
        refetch();
      })
      .catch((error) => {
        console.log(error);
        toast.error("Could not update event coordinator access.");
      })
      .finally(() => setUpdatingId(null));
  };

  const columns: Column<User>[] = [
    {
      header: "Coordinator",
      fieldName: "firstName",
      accessor: (user) => (
        <NameDetail
          name={`${user.firstName || ""} ${user.lastName || ""}`.trim() || "-"}
          email={user.email}
          imgSrc={user.profilePic || ""}
        />
      ),
      className: "!px-4 min-w-[260px]",
      canNotHide: true,
    },
    {
      header: "Company",
      fieldName: "eventCoordinatorCompanyName",
      accessor: (user) => user.eventCoordinatorCompanyName || "-",
    },
    {
      header: "Contact",
      fieldName: "mobileNumber",
      accessor: (user) =>
        user.mobileNumber ? `${user.countryCode || ""} ${user.mobileNumber}` : "-",
    },
    {
      header: "Address",
      fieldName: "eventCoordinatorFormattedAddress",
      accessor: (user) => compactAddress(user),
      className: "min-w-[260px]",
    },
    {
      header: "Tax ID",
      fieldName: "eventCoordinatorTaxIdMasked",
      accessor: (user) =>
        user.eventCoordinatorTaxIdMasked
          ? `${user.eventCoordinatorTaxIdType || "Tax ID"} ending ${user.eventCoordinatorTaxIdMasked.slice(-4)}`
          : "-",
    },
    {
      header: "Payout",
      fieldName: "eventCoordinatorPaymentPreference",
      accessor: (user) => {
        const preference = user.eventCoordinatorPaymentPreference || "";
        return preference ? PAYMENT_LABELS[preference] || preference : "-";
      },
    },
    {
      header: "QR Code",
      fieldName: "eventCoordinatorPaymentQrCodeUrl",
      accessor: (user) =>
        user.eventCoordinatorPaymentQrCodeUrl ? (
          <div className="flex items-center gap-3">
            <Image
              src={user.eventCoordinatorPaymentQrCodeUrl}
              alt="Coordinator payout QR code"
              width={48}
              height={48}
              unoptimized
              className="h-12 w-12 rounded border object-cover"
            />
            <a
              href={user.eventCoordinatorPaymentQrCodeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              Open QR
              <ExternalLink size={14} />
            </a>
          </div>
        ) : (
          "-"
        ),
    },
    {
      header: "Access",
      fieldName: "isEventCoordinator",
      accessor: (user) => (
        <div className="flex items-center gap-3">
          <Switch
            checked={!!user.isEventCoordinator}
            disabled={updatingId === user._id}
            onClick={(event) => {
              event.stopPropagation();
              changeCoordinatorStatus(user, !user.isEventCoordinator);
            }}
          />
          <Badge
            className={
              user.isEventCoordinator
                ? "bg-green-100 text-green-700 hover:bg-green-100"
                : "bg-slate-100 text-slate-600 hover:bg-slate-100"
            }
          >
            {user.isEventCoordinator ? "Enabled" : "Disabled"}
          </Badge>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-between">
        <div className="font-semibold text-[28px] leading-[42px] mb-2">
          Event Coordinators
        </div>
      </div>
      <DataTable
        columns={columns as any}
        data={(result?.data?.data?.records || []) as any}
        totalRecords={result?.data?.data?.total || 0}
        isLoading={isFetching}
        onSearch={(value: string) => debouncedSearch(value)}
        currentPage={pagination.page}
        pageSize={pagination.limit}
        setPagination={setPagination}
        hideColumnFilter={true}
        extraTemplate={
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          >
            <SelectTrigger className="!h-10 min-w-[160px] bg-[#D9D9D933]">
              <SelectValue placeholder="Access" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All access</SelectItem>
                <SelectItem value="enabled">Enabled</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        }
      />
    </>
  );
}
