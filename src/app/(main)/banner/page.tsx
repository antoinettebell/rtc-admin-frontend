"use client";
import { LoaderCircle, Trash } from "lucide-react";
import * as React from "react";
import { useState } from "react";
import { Column, DataTable } from "@/components/ui/data-table";
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
import { useDebouncedCallback } from "@/hooks/use-debounced-callback/use-debounced-callback";
import { useQuery } from "@tanstack/react-query";
import { Banner } from "@/interfaces/user-interface";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { bannerApiService } from "@/services/banner-api-service";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import PhotoViewer from "@/components/ui/photo-viewer";

export default function Banners() {
  const router = useRouter();
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [searchTerm, setSearchTerm] = useState("");

  const [deleteBanner, setDeleteBanner] = useState<Banner | null>(null);
  const [deletingBanner, setDeletingBanner] = useState<boolean>(false);

  const {
    data: result,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["banner-list", pagination.page, pagination.limit, searchTerm],
    queryFn: () =>
      bannerApiService.list(searchTerm, pagination.page, pagination.limit),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setSearchTerm(value);
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  }, 500);

  const columns: Column<Banner>[] = [
    {
      header: "Banner",
      fieldName: "imageUrl",
      accessor: (d) => (
        <div
          className="border rounded overflow-hidden h-[75px] w-[110px]"
          onClick={(e) => e.stopPropagation()}
        >
          <PhotoViewer src={d.imageUrl}>
            <img
              loading="lazy"
              decoding="async"
              data-nimg="1"
              className="h-full w-full object-cover transition-all hover:scale-105 aspect-[4/3] cursor-pointer"
              src={d.imageUrl}
            />
          </PhotoViewer>
        </div>
      ),
    },
    {
      header: "Title",
      fieldName: "title",
      accessor: (d) => d.title || "-",
    },
    {
      header: "From Date",
      fieldName: "fromDate",
      accessor: (d) =>
        d.fromDate ? (
          <span>{dayjs(d.fromDate).format("DD MMM, YYYY")}</span>
        ) : (
          "-"
        ),
    },
    {
      header: "To Date",
      fieldName: "fromDate",
      accessor: (d) =>
        d.toDate ? <span>{dayjs(d.toDate).format("DD MMM, YYYY")}</span> : "-",
    },
    {
      header: "Action",
      fieldName: "_id",
      accessor: (d) => (
        <Trash
          className="text-red-600 p-1"
          size={18}
          onClick={(e) => {
            e.stopPropagation();
            setDeleteBanner(d);
          }}
        />
      ),
    },
  ];

  const onDeleteBanner = () => {
    if (!deleteBanner || !deleteBanner._id) return;
    setDeletingBanner(true);
    bannerApiService
      .destroy(deleteBanner._id)
      .then(() => {
        toast.success("Banner deleted");
        setDeleteBanner(null);
        refetch();
      })
      .catch((e) => {
        toast.error(
          e.response?.data?.message || "Error while deleting the banner",
        );
      })
      .finally(() => setDeletingBanner(false));
  };

  return (
    <>
      <div className="flex justify-between">
        <div className="font-semibold text-[28px] leading-[42px] mb-2">
          Banners
        </div>

        <Button onClick={() => router.push("/banner/form")}>Add Banner</Button>
      </div>
      <DataTable
        columns={columns as any}
        data={(result?.data?.data?.records || []) as any}
        totalRecords={result?.data?.data?.total || 0}
        isLoading={isFetching}
        onSearch={(s: string) => debouncedSearch(s)}
        currentPage={pagination.page}
        pageSize={pagination.limit}
        setPagination={setPagination}
        hideColumnFilter={true}
        onRowClick={(d) => router.push(`/banner/form?q=${d._id}`)}
      />
      {!!deleteBanner && (
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure want to delete selected banner?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteBanner(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={deletingBanner}
                onClick={() => onDeleteBanner()}
              >
                Yes, Delete it
                {deletingBanner && (
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
