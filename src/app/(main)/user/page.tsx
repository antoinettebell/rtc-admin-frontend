"use client";
import { LoaderCircle } from "lucide-react";
import * as React from "react";
import { useEffect, useState } from "react";
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
import { userApiService } from "@/services/user-api-service";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback/use-debounced-callback";
import { useQuery } from "@tanstack/react-query";
import { User } from "@/interfaces/user-interface";
import { NameDetail } from "@/components/ui/name-detail";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Status } from "@/components/ui/status";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";

export default function Users() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState<null | string>(null);
  const [paramST, setParamST] = useState<null | string>(null);

  const [changeStatus, setChangeStatus] = useState<User | null>(null);
  const [changing, setChanging] = useState<boolean>(false);

  useEffect(() => {
    let st = searchParams.get("status");
    st = ["inactive"].includes(st) ? st : null;
    setStatus(st || null);
    setParamST(st || null);
  }, [searchParams]);

  const {
    data: result,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: [
      "user-list",
      pagination.page,
      pagination.limit,
      searchTerm,
      status,
    ],
    queryFn: () =>
      userApiService.listCustomer(
        pagination.page,
        status,
        searchTerm,
        pagination.limit,
      ),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setSearchTerm(value);
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  }, 500);

  const onStatusChange = () => {
    if (!changeStatus) return;
    setChanging(true);
    userApiService
      .changeStatus(changeStatus._id, !changeStatus.inactive)
      .then((res) => {
        toast.success("Status is changed.");
        setChangeStatus(null);
        refetch();
      })
      .catch((e) => {
        console.log(e);
        toast.error("Something went wrong");
      })
      .finally(() => {
        setChanging(false);
      });
  };

  const columns: Column<User>[] = [
    {
      header: "Name",
      fieldName: "firstName",
      accessor: (d) => (
        <NameDetail
          name={`${d.firstName} ${d.lastName || ""}`}
          email={d.email}
          imgSrc={d.organization_logo}
          avatarClassName={"object-contain"}
        />
      ),
      // sortable: true,
      className: "!px-4 w-[270px]",
      canNotHide: true,
    },
    {
      header: "Contact",
      fieldName: "mobileNumber",
      accessor: (d) => `${d.countryCode} ${d.mobileNumber}`,
    },
    {
      header: "Active",
      fieldName: "inactive",
      accessor: (d) => (
        <Switch
          checked={!d.inactive}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setChangeStatus(d);
          }}
        />
      ),
    },
  ];

  const statusSelect = (): React.ReactNode => {
    return (
      <Select
        value={status}
        onValueChange={(val) => {
          setStatus(val);
        }}
      >
        <SelectTrigger className="!h-10 min-w-[100px] bg-[#D9D9D933]">
          <SelectValue placeholder="Select column" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value={null}>All</SelectItem>
            <SelectItem value={"inactive"}>Inactive</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );
  };

  return (
    <>
      <div className="flex justify-between">
        <div className="font-semibold text-[28px] leading-[42px] mb-2">
          Users
        </div>
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
        extraTemplate={paramST ? <></> : statusSelect()}
      />
      {!!changeStatus && (
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure want to change status to{" "}
                <b>{changeStatus.inactive ? "Active" : "Inactive"}</b> of the
                user{" "}
                <b>
                  {`${changeStatus.firstName} ${changeStatus.lastName || ""}`.trim()}
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
