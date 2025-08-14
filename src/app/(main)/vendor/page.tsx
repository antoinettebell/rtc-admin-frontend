"use client";
import { Edit, Eye, LoaderCircle } from "lucide-react";
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
import { foodTruckApiService } from "@/services/food-truck-api-service";
import { StringHelper } from "@/models/string-helper-model";
import { LoadingButton } from "@/components/loading-button";
import dayjs from "dayjs";

export default function Vendors() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize page & limit from URL (?p=&l=)
  const initialPage = (() => {
    const p = parseInt(searchParams.get("p") || "1", 10);
    return Number.isFinite(p) && p > 0 ? p : 1;
  })();
  const initialLimit = (() => {
    const l = parseInt(searchParams.get("l") || "10", 10);
    return Number.isFinite(l) && l > 0 ? l : 10;
  })();

  const [pagination, setPagination] = useState({
    page: initialPage,
    limit: initialLimit,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState<null | string>(null);
  const [paramST, setParamST] = useState<null | string>(null);

  const [changeStatus, setChangeStatus] = useState<User | null>(null);
  const [changing, setChanging] = useState<boolean>(false);

  const [changeFeature, setChangeFeature] = useState<User | null>(null);
  const [changingFeature, setChangingFeature] = useState<boolean>(false);

  const [exporting, setExporting] = useState<boolean>(false);

  // Read status from URL whenever it changes
  useEffect(() => {
    let st = searchParams.get("status");
    st = ["PENDING", "APPROVED", "REJECTED"].includes(st) ? st : null;
    setStatus(st || null);
    setParamST(st || null);
  }, [searchParams]);

  // Keep p & l in URL in sync with state (preserving status)
  useEffect(() => {
    const currentP = searchParams.get("p") || "";
    const currentL = searchParams.get("l") || "";
    const needUpdate =
      currentP !== String(pagination.page) ||
      currentL !== String(pagination.limit);
    if (!needUpdate) return;

    const params = new URLSearchParams();
    if (status) params.set("status", status);
    params.set("p", String(pagination.page));
    params.set("l", String(pagination.limit));
    router.replace(`/vendor?${params.toString()}`);
  }, [pagination.page, pagination.limit, status, router, searchParams]);

  const {
    data: result,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: [
      "vendor-list",
      pagination.page,
      pagination.limit,
      searchTerm,
      status,
    ],
    queryFn: () =>
      userApiService.listVendors(
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

  const callExport = () => {
    if (!result?.data?.data?.total) return;
    setExporting(true);

    userApiService
      .listVendors(1, status || "", searchTerm, result?.data?.data?.total)
      .then((res) => {
        const jsonData = res.data.data.records.map((itm) => ({
          VendorId: itm._id,
          "Vendor Name": itm.firstName,
          "Vendor Email": itm.email,
          "Mobile Number": itm.mobileNumber
            ? `(${itm.countryCode}) ${itm.mobileNumber}`
            : "",
          "Request Status": itm.requestStatus,
          "Vendor Image": itm.profilePic || "",
          Verified: itm.verified ? "Yes" : "No",
          Inactive: itm.inactive ? "Yes" : "No",
          foodTruckId: itm.foodTruck?._id,
          "FoodTruck Name": itm.foodTruck?.name,
          "FoodTruck Featured": itm.foodTruck?.featured ? "Yes" : "No",
          "FoodTruck SSN": itm.foodTruck?.ssn || itm.foodTruck?.snn || "",
          "FoodTruck EIN": itm.foodTruck?.ein || "",
          "FoodTruck Type": itm.foodTruck?.infoType,
          "FoodTruck Logo": itm.foodTruck?.logo || "",
          "FoodTruck Images": (itm.foodTruck?.photos || []).join(", "),
          "FoodTruck Locations": JSON.stringify(itm.foodTruck?.locations || []),
          "FoodTruck Availability": JSON.stringify(
            itm.foodTruck?.availability || [],
          ),
          "FoodTruck PlanId": itm.foodTruck?.plan?._id || "",
          "FoodTruck Plan Name": itm.foodTruck?.plan?.name || "",
          "FoodTruck Total Cuisines": itm.foodTruck?.cuisine?.length || 0,
        }));
        StringHelper.downloadCSV(
          jsonData,
          `vendor_${dayjs().format(`YYYY-MM-DD-HH-mm-ss`)}`,
        );
      })
      .catch((e) => {
        console.log(e);
        toast.error("Something went wrong");
      })
      .finally(() => {
        setExporting(false);
      });
  };

  const onFeatureChange = () => {
    if (
      !changeFeature ||
      !!changeFeature.foodTruck?.inactive ||
      !changeFeature.foodTruck?._id
    )
      return;
    setChangingFeature(true);
    foodTruckApiService
      .updateExtra(
        changeFeature.foodTruck._id,
        !changeFeature.foodTruck?.featured,
      )
      .then((res) => {
        toast.success("Feature mark is changed.");
        setChangeFeature(null);
        refetch();
      })
      .catch((e) => {
        console.log(e);
        toast.error("Something went wrong");
      })
      .finally(() => {
        setChangingFeature(false);
      });
  };

  const columns: Column<User>[] = [
    {
      header: "Food Truck Name",
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
      header: "Detail",
      fieldName: "mobileNumber",
      accessor: (d) =>
        d.foodTruck ? (
          <NameDetail
            name={`${d.foodTruck.name || ""}`}
            email={`${d.foodTruck.cuisine?.length || 0} cuisine${d.foodTruck.cuisine?.length > 1 ? "s" : ""}`}
            imgSrc={d.foodTruck.logo || d.foodTruck.photos[0] || ""}
            avatarClassName={"object-contain"}
          />
        ) : (
          "-"
        ),
    },
    {
      header: "Type",
      fieldName: "mobileNumber",
      accessor: (d) =>
        d.foodTruck ? (
          <div className="capitalize">{d.foodTruck.infoType}</div>
        ) : (
          "-"
        ),
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
          disabled={d.requestStatus !== "APPROVED"}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setChangeStatus(d);
          }}
          title={
            d.requestStatus !== "APPROVED"
              ? "It will be enabled after the request approved"
              : ""
          }
        />
      ),
    },
    {
      header: "Featured",
      fieldName: "featured" as keyof User,
      accessor: (d) => (
        <Switch
          checked={!!d.foodTruck?.featured}
          disabled={d.requestStatus !== "APPROVED"}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setChangeFeature(d);
          }}
          title={
            d.requestStatus !== "APPROVED"
              ? "It will be enabled after the request approved"
              : ""
          }
        />
      ),
    },
    {
      header: "ssn",
      fieldName: "ssn" as keyof User,
      accessor: (d) => d.foodTruck?.ssn || d.foodTruck?.snn || "",
    },
    {
      header: "ein",
      fieldName: "ein" as keyof User,
      accessor: (d) => d.foodTruck?.ein || "",
    },
    {
      header: "Request",
      fieldName: "requestStatus",
      accessor: (d) => <Status status={d.requestStatus} />,
    },
    {
      header: "Action",
      fieldName: "requestStatus",
      className: "flex justify-center",
      accessor: (d) => (
        <div className="flex gap-2 justify-center items-center mr-2">
          <Eye className="text-primary" size={18} />
          <Edit
            className="text-blue-600 p-1"
            size={22}
            onClick={(e) => {
              const params = new URLSearchParams();
              if (d?._id) params.set("q", d._id);
              if (pagination?.page) params.set("p", pagination.page.toString());
              if (pagination?.limit)
                params.set("l", pagination.limit.toString());
              const qs = params.toString();
              router.push(`/vendor/edit?${qs}`);
              e.stopPropagation();
            }}
          />
        </div>
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
            <SelectItem value={"PENDING"}>Pending</SelectItem>
            <SelectItem value={"APPROVED"}>Approved</SelectItem>
            <SelectItem value={"REJECTED"}>Rejected</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );
  };

  return (
    <>
      <div className="flex justify-between">
        <div className="font-semibold text-[28px] leading-[42px] mb-2 flex justify-between flex-wrap gap-2 w-full">
          Vendors
          <LoadingButton
            isLoading={exporting}
            disabled={exporting}
            onClick={(e) => {
              callExport();
            }}
            className="text-base font-medium min-w-[135px]"
          >
            Export
          </LoadingButton>
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
        onRowClick={(d: any) => {
          const params = new URLSearchParams();
          if (d?._id) params.set("q", d._id);
          if (pagination?.page) params.set("p", pagination.page.toString());
          if (pagination?.limit) params.set("l", pagination.limit.toString());
          const qs = params.toString();
          router.push(`/vendor/detail?${qs}`);
        }}
      />
      {!!changeStatus && (
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure want to change status to{" "}
                <b>{changeStatus.inactive ? "Active" : "Inactive"}</b> of the
                vendor{" "}
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

      {!!changeFeature && (
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure want to{" "}
                {changeFeature.foodTruck?.featured ? (
                  <>
                    remove this from <b>featured</b> listing
                  </>
                ) : (
                  <>
                    mark it as <b>featured</b>
                  </>
                )}
                ?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setChangeFeature(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={changingFeature}
                onClick={() => onFeatureChange()}
              >
                {changeFeature.foodTruck?.featured
                  ? "Yes, Remove it"
                  : "Yes, Mark it"}
                {changingFeature && (
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
