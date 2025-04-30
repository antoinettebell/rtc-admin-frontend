"use client";
import { LoaderCircle } from "lucide-react";
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
// import { Status } from "@/components/ui/status";
import { userApiService } from "@/services/user-api-service";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback/use-debounced-callback";
import { useQuery } from "@tanstack/react-query";
import { User } from "@/interfaces/user-interface";
import { NameDetail } from "@/components/ui/name-detail";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function Vendors() {
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [searchTerm, setSearchTerm] = useState("");

  const [changeStatus, setChangeStatus] = useState<User | null>(null);
  const [changing, setChanging] = useState<boolean>(false);

  const {
    data: result,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["vendor-list", pagination.page, pagination.limit, searchTerm],
    queryFn: () =>
      userApiService.listVendors(pagination.page, searchTerm, pagination.limit),
    // keepPreviousData: false,
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
            e.preventDefault();
            setChangeStatus(d);
          }}
        />
      ),
    },
    // {
    //   header: "Primary colour",
    //   fieldName: "primary_color",
    //   accessor: (d) => colorView(d.primary_color),
    // },
    // {
    //   fieldName: "secondary_color",
    //   header: "Secondary colour",
    //   accessor: (d) => colorView(d.secondary_color),
    // },
  ];

  // const handleEdit = (organization: Organization) => {
  //   // Implement edit logic
  //   console.log("Edit:", organization);
  //   router.push(`/organizations/edit/${organization.id}`);
  // };
  //
  // const handleDelete = (organization: Organization) => {
  //   // Implement delete logic
  //   console.log("Delete:", organization);
  //   setDeleteOrg(organization);
  // };
  //
  // const renderActions = (organization: Organization) =>
  //   (permissions?.organizations?.canUpdate ||
  //     permissions?.organizations?.canDelete) && (
  //     <DropdownMenu>
  //       <DropdownMenuTrigger asChild>
  //         <Button variant="ghost" className="h-4 w-4 p-1">
  //           <MoreHorizontal />
  //         </Button>
  //       </DropdownMenuTrigger>
  //       <DropdownMenuContent align="end">
  //         <DropdownMenuLabel>Actions</DropdownMenuLabel>
  //         {permissions?.organizations?.canUpdate && (
  //           <DropdownMenuItem
  //             onClick={() => setTimeout(() => handleEdit(organization))}
  //           >
  //             <Edit3Icon className="text-blue-700"></Edit3Icon> Edit
  //           </DropdownMenuItem>
  //         )}
  //         {permissions?.organizations?.canDelete && (
  //           <DropdownMenuItem
  //             onClick={() => setTimeout(() => handleDelete(organization))}
  //           >
  //             <TrashIcon className="text-red-700"></TrashIcon> Delete
  //           </DropdownMenuItem>
  //         )}
  //       </DropdownMenuContent>
  //     </DropdownMenu>
  //   );

  return (
    <>
      <div className="flex justify-between">
        <div className="font-semibold text-[28px] leading-[42px] mb-2">
          Vendors
        </div>
      </div>
      <DataTable
        columns={columns as any}
        data={(result?.data?.data?.records || []) as any}
        totalRecords={result?.data?.data?.total || 0}
        // actions={renderActions}
        isLoading={isFetching}
        onSearch={(s: string) => debouncedSearch(s)}
        currentPage={pagination.page}
        pageSize={pagination.limit}
        setPagination={setPagination}
        hideColumnFilter={true}
        // setSortOrder={setSortOrder as any}
        // sortOrder={sortOrder as any}
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
    </>
  );
}
