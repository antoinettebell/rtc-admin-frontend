"use client";

import * as React from "react";
import { useState } from "react";
import dayjs from "dayjs";
import { Download, Eye, Flag, FolderArchive, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Column, DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
  MarketplaceRepositoryFile,
  marketplaceApiService,
} from "@/services/marketplace-api-service";

const fileTypeLabels: Record<string, string> = {
  EVENT_IMAGE: "Event Image",
  BID_MENU_PDF: "Menu PDF",
  BID_IMAGE: "Bid Image",
  PERMIT_LICENSE: "Permit/License",
  REQUIREMENT_DOCUMENT: "Requirement",
  AGREEMENT_DOCUMENT: "Agreement Placeholder",
};

const formatBytes = (value?: number | null) => {
  const bytes = Number(value || 0);
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function MarketplaceRepositoryPage() {
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data: result, isFetching, refetch } = useQuery({
    queryKey: [
      "marketplace-repository",
      pagination.page,
      pagination.limit,
    ],
    queryFn: () =>
      marketplaceApiService.listRepositoryFiles({
        page: pagination.page,
        limit: pagination.limit,
      }),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const accessFile = async (
    file: MarketplaceRepositoryFile,
    download = false,
  ) => {
    try {
      const response = await marketplaceApiService.accessFile(
        file.attachment_id,
        download,
      );
      const url = response.data.data.file_url;
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to access file");
    }
  };

  const updateStatus = async (
    file: MarketplaceRepositoryFile,
    nextStatus: "ARCHIVED" | "DELETED" | "FLAGGED",
  ) => {
    const reason = window.prompt(`Reason for ${nextStatus.toLowerCase()}?`);
    if (!reason?.trim()) return;

    setUpdatingId(file.attachment_id);
    try {
      await marketplaceApiService.updateFileStatus(
        file.attachment_id,
        nextStatus,
        reason.trim(),
      );
      toast.success(`File marked ${nextStatus.toLowerCase()}`);
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to update file");
    } finally {
      setUpdatingId(null);
    }
  };

  const columns: Column<MarketplaceRepositoryFile>[] = [
    {
      header: "File",
      fieldName: "original_name",
      accessor: (file) => (
        <div className="min-w-[220px]">
          <div className="font-medium">{file.original_name || "Unnamed file"}</div>
          <div className="text-xs text-muted-foreground break-all">
            {file.file_key || "-"}
          </div>
        </div>
      ),
      canNotHide: true,
      className: "w-[280px]",
    },
    {
      header: "Event",
      fieldName: "event_id",
      accessor: (file) => (
        <div>
          <div>{file.marketplaceEvent?.event_name || "-"}</div>
          <div className="text-xs text-muted-foreground">{file.event_id}</div>
        </div>
      ),
    },
    {
      header: "Bid",
      fieldName: "bid_id",
      accessor: (file) => file.bid_id || "-",
    },
    {
      header: "Vendor",
      fieldName: "vendor_user_id",
      accessor: (file) => (
        <div className="text-xs">
          <div>Vendor: {file.vendor_user_id || "-"}</div>
          <div>Truck: {file.food_truck_id || "-"}</div>
        </div>
      ),
    },
    {
      header: "Uploaded By",
      fieldName: "uploaded_by_user_id",
      accessor: (file) => file.uploaded_by_user_id || "-",
    },
    {
      header: "Type",
      fieldName: "attachment_type",
      accessor: (file) =>
        file.requirement_label
          ? `${fileTypeLabels[file.attachment_type] || file.attachment_type}: ${
              file.requirement_label
            }`
          : fileTypeLabels[file.attachment_type] || file.attachment_type,
    },
    {
      header: "Size",
      fieldName: "size_bytes",
      accessor: (file) => formatBytes(file.size_bytes),
    },
    {
      header: "Uploaded",
      fieldName: "created_at",
      accessor: (file) =>
        file.created_at ? dayjs(file.created_at).format("YYYY-MM-DD HH:mm") : "-",
    },
    {
      header: "Status",
      fieldName: "status",
      accessor: (file) => (
        <span className="rounded-full border px-2 py-1 text-xs font-medium">
          {file.status}
        </span>
      ),
    },
  ];

  const files = result?.data?.data?.records || [];
  const total = result?.data?.data?.total || 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Marketplace Repository</h1>
        <p className="text-sm text-muted-foreground">
          Review marketplace event images, bid menus, food images, and
          permit/license documents.
        </p>
      </div>

      <DataTable
        data={files}
        columns={columns}
        isLoading={isFetching}
        totalRecords={total}
        currentPage={pagination.page}
        pageSize={pagination.limit}
        setPagination={setPagination}
        actions={(file) => (
          <div className="flex min-w-[190px] flex-wrap gap-1">
            <Button size="sm" variant="outline" onClick={() => accessFile(file)}>
              <Eye className="mr-1 h-4 w-4" /> View
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => accessFile(file, true)}
            >
              <Download className="mr-1 h-4 w-4" /> Download
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={updatingId === file.attachment_id || file.status === "DELETED"}
              onClick={() => updateStatus(file, "ARCHIVED")}
            >
              <FolderArchive className="mr-1 h-4 w-4" /> Archive
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={updatingId === file.attachment_id || file.status === "DELETED"}
              onClick={() => updateStatus(file, "FLAGGED")}
            >
              <Flag className="mr-1 h-4 w-4" /> Flag
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={updatingId === file.attachment_id || file.status === "DELETED"}
              onClick={() => updateStatus(file, "DELETED")}
            >
              <Trash2 className="mr-1 h-4 w-4" /> Delete
            </Button>
          </div>
        )}
      />
    </div>
  );
}
