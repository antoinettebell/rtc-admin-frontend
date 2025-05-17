"use client";
import * as React from "react";
import { useState } from "react";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback/use-debounced-callback";
import { useQuery } from "@tanstack/react-query";
import { cuisineApiService } from "@/services/cuisine-api-service";
import { Cuisine } from "@/interfaces/user-interface";
import { Command, CommandInput } from "@/components/ui/command";
import { Card } from "@/components/ui/card";
import { LoaderCircle, Pencil, Soup, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function Cuisines() {
  const [pagination, setPagination] = useState({ page: 1, limit: 1000 });
  const [searchTerm, setSearchTerm] = useState("");

  const [deleteCui, setDeleteCui] = useState<Cuisine | null>(null);
  const [deletingCui, setDeletingCui] = useState<boolean>(false);

  const [addCui, setAddCui] = useState<Cuisine | null>(null);
  const [addingCui, setAddingCui] = useState<boolean>(false);

  const [editCui, setEditCui] = useState<Cuisine | null>(null);
  const [editingCui, setEditingCui] = useState<boolean>(false);

  const {
    data: result,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["cuisine-list", pagination.page, pagination.limit, searchTerm],
    queryFn: () =>
      cuisineApiService.list(searchTerm, pagination.page, pagination.limit),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setSearchTerm(value);
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  }, 500);

  const onAddCuisine = () => {
    if (!addCui || !addCui.name.trim()) return;
    setAddingCui(true);
    cuisineApiService
      .add(addCui.name)
      .then(() => {
        toast.success("Cuisine added");
        setAddCui(null);
        setEditCui(null);
        refetch();
      })
      .catch((e) => {
        toast.error(
          e.response?.data?.message || "Error while adding the cuisine",
        );
      })
      .finally(() => setAddingCui(false));
  };

  const onEditCuisine = () => {
    if (!editCui || !editCui.name.trim() || !editCui._id) return;
    setEditingCui(true);
    cuisineApiService
      .update(editCui._id, editCui.name)
      .then(() => {
        toast.success("Cuisine updated");
        setAddCui(null);
        setEditCui(null);
        refetch();
      })
      .catch((e) => {
        toast.error(
          e.response?.data?.message || "Error while updating the cuisine",
        );
      })
      .finally(() => setEditingCui(false));
  };

  const onDeleteCuisine = () => {
    if (!deleteCui || !deleteCui._id) return;
    setDeletingCui(true);
    cuisineApiService
      .destroy(deleteCui._id)
      .then(() => {
        toast.success("Cuisine deleted");
        setDeleteCui(null);
        refetch();
      })
      .catch((e) => {
        toast.error(
          e.response?.data?.message || "Error while deleting the cuisine",
        );
      })
      .finally(() => setDeletingCui(false));
  };

  return (
    <>
      <div className="flex justify-between">
        <div className="font-semibold text-[28px] leading-[42px] mb-2">
          Cuisines
        </div>

        <Button onClick={() => setAddCui({ name: "", _id: "" })}>
          Add Cuisine
        </Button>
      </div>
      <div className="space-y-4 max-h-full max-w-full h-full w-full flex flex-col">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Command className="max-w-[220px] border border-[#d9d9d9]">
              <CommandInput
                placeholder="Search..."
                className="h-9"
                onValueChange={(s) => debouncedSearch(s)}
              />
            </Command>
          </div>
        </div>
        {isFetching ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 5xl:grid-cols-4 gap-4 *:data-[slot=card]:shadow-xs *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card">
              <Skeleton className="h-[40px] w-full @container/card" />
              <Skeleton className="h-[40px] w-full @container/card" />
              <Skeleton className="h-[40px] w-full @container/card" />
              <Skeleton className="h-[40px] w-full @container/card" />
              <Skeleton className="h-[40px] w-full @container/card" />
              <Skeleton className="h-[40px] w-full @container/card" />
            </div>
          </>
        ) : (
          <>
            {!result?.data?.data?.records?.length ? (
              <div className="p-4 text-xl flex w-full justify-center">
                No cuisine found{" "}
                {searchTerm.trim()
                  ? `with "${searchTerm.trim()}" name, Please try another keyword`
                  : ""}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 5xl:grid-cols-4 gap-4 *:data-[slot=card]:shadow-xs *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card">
                {result?.data?.data?.records.map((item, inx) => (
                  <Card
                    key={`cuisine-card-${inx}`}
                    className="@container/card hover-card-item border"
                  >
                    <div className="flex gap-3 justify-between px-3 py-2 items-center">
                      <div className="flex gap-3 items-center">
                        <Soup size={20} className="text-primary" />
                        <div className="text-base truncate">{item.name}</div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          className="bg-red-500"
                          onClick={() => setDeleteCui(item)}
                          size="xs"
                        >
                          <Trash
                            size={12}
                            strokeWidth={3}
                            className="cursor-pointer text-white"
                          />
                        </Button>

                        <Button
                          className="bg-blue-600"
                          onClick={() => setEditCui({ ...item })}
                          size="xs"
                        >
                          <Pencil
                            size={12}
                            strokeWidth={3}
                            className="cursor-pointer text-white"
                          />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {(addCui || editCui) && (
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {addCui ? "Add" : "Update"} Cuisine
              </AlertDialogTitle>
              <AlertDialogDescription>
                <Input
                  placeholder="Enter cuisine name"
                  className="h-9 my-2"
                  defaultValue={
                    addCui ? addCui.name : editCui ? editCui.name : ""
                  }
                  onChange={(e) => {
                    if (addCui) {
                      setAddCui((prev) => ({
                        ...addCui,
                        name: e.target.value,
                      }));
                    }
                    if (editCui) {
                      setEditCui((prev) => ({
                        ...editCui,
                        name: e.target.value,
                      }));
                    }
                  }}
                />
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setAddCui(null);
                  setEditCui(null);
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={
                  addingCui ||
                  editingCui ||
                  !(addCui ? addCui.name : editCui ? editCui.name : "").trim()
                }
                onClick={() => (addCui ? onAddCuisine() : onEditCuisine())}
              >
                {addCui ? "Save" : "Update"}
                {addingCui ||
                  (editingCui && (
                    <LoaderCircle size={16} className="animate-spin" />
                  ))}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {!!deleteCui && (
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure want to delete <b>"{deleteCui.name}"</b> cuisine?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteCui(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={deletingCui}
                onClick={() => onDeleteCuisine()}
              >
                Yes, Delete it
                {deletingCui && (
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
