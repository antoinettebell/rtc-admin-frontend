"use client";
import * as React from "react";
import { useState } from "react";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback/use-debounced-callback";
import { useQuery } from "@tanstack/react-query";
import { categoriesApiService } from "@/services/categories-api-service";
import { Categoriess } from "@/interfaces/user-interface";
import { Command, CommandInput } from "@/components/ui/command";
import { Card } from "@/components/ui/card";
import { LoaderCircle, Pencil, Salad, Trash,UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,  
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export default function Categories() {
  const [pagination, setPagination] = useState({ page: 1, limit: 1000 });
  const [searchTerm, setSearchTerm] = useState("");

  const [deleteCui, setDeleteCui] = useState<Categoriess | null>(null);
  const [deletingCui, setDeletingCui] = useState<boolean>(false);

  const [addCui, setAddCui] = useState<Categoriess | null>(null);
  const [addingCui, setAddingCui] = useState<boolean>(false);

  const [editCui, setEditCui] = useState<Categoriess | null>(null);
  const [editingCui, setEditingCui] = useState<boolean>(false);

  const {
    data: result,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["categories-list", pagination.page, pagination.limit, searchTerm],
    queryFn: () =>
      categoriesApiService.list(searchTerm, pagination.page, pagination.limit),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setSearchTerm(value);
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  }, 500);

  const handleCloseAddEditDialog = () => {
    setAddCui(null);
    setEditCui(null);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteCui(null);
  };

  const onAddCategories = () => {
    if (!addCui || !addCui.name.trim()) return;
    setAddingCui(true);
    categoriesApiService
      .add(addCui.name)
      .then(() => {
        toast.success("Categories added");
        setAddCui(null);
        setEditCui(null);
        refetch();
      })
      .catch((e) => {
        toast.error(e.response?.data?.message || "Error while adding the categories");
      })
      .finally(() => setAddingCui(false));
  };

  const onEditCategories = () => {
    if (!editCui || !editCui.name.trim() || !editCui._id) return;
    setEditingCui(true);
    categoriesApiService
      .update(editCui._id, editCui.name)
      .then(() => {
        toast.success("Categories updated");
        setAddCui(null);
        setEditCui(null);
        refetch();
      })
      .catch((e) => {
        toast.error(
          e.response?.data?.message || "Error while updating the categories",
        );
      })
      .finally(() => setEditingCui(false));
  };

  const onDeleteCategories = () => {
    if (!deleteCui || !deleteCui._id) return;
    setDeletingCui(true);
    categoriesApiService
      .destroy(deleteCui._id)
      .then(() => {
        toast.success("Categories deleted");
        setDeleteCui(null);
        refetch();
      })
      .catch((e) => {
        toast.error(
          e.response?.data?.message || "Error while deleting the categories",
        );
      })
      .finally(() => setDeletingCui(false));
  };

  return (
    <>
      <div className="flex justify-between">
        <div className="font-semibold text-[28px] leading-[42px] mb-2">
          Categories
        </div>

        <Button onClick={() => setAddCui({ name: "", _id: "" })}>
          Add Categories
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
                No categories found{" "}
                {searchTerm.trim()
                  ? `with "${searchTerm.trim()}" name, Please try another keyword`
                  : ""}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 5xl:grid-cols-4 gap-4 *:data-[slot=card]:shadow-xs *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card">
                {result?.data?.data?.records.map((item, inx) => (
                  <Card
                    key={`categories-card-${inx}`}
                    className="@container/card hover-card-item border"
                  >
                    <div className="flex gap-3 justify-between px-3 py-2 items-center">
                      <div className="flex gap-3 items-center">
                        <UtensilsCrossed size={20} className="text-purple-600" />
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

      {/* Add/Edit Categories Dialog */}
      <Dialog 
        open={!!(addCui || editCui)} 
        onOpenChange={(open) => {
          if (!open) handleCloseAddEditDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {addCui ? "Add" : "Update"} Categories
            </DialogTitle>
            <DialogDescription>
              Enter the categories name below.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter categories name"
              className="h-9"
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseAddEditDialog}>
              Cancel
            </Button>
            <Button
              disabled={
                addingCui ||
                editingCui ||
                !(addCui ? addCui.name : editCui ? editCui.name : "").trim()
              }
              onClick={() => (addCui ? onAddCategories() : onEditCategories())}
            >
              {addCui ? "Save" : "Update"}
              {(addingCui || editingCui) && (
                <LoaderCircle size={16} className="animate-spin ml-2" />
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Categories Dialog */}
      <AlertDialog 
        open={!!deleteCui} 
        onOpenChange={(open) => {
          if (!open) handleCloseDeleteDialog();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure want to delete <b>"{deleteCui?.name}"</b> categories?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseDeleteDialog}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deletingCui}
              onClick={() => onDeleteCategories()}
            >
              Yes, Delete it
              {deletingCui && (
                <LoaderCircle size={16} className="animate-spin" />
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}