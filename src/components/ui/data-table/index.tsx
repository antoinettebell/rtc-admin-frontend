"use client";

import { Dispatch, MutableRefObject, SetStateAction, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react";
import { TableSkeleton } from "./table-skeleton";
import { Command, CommandInput } from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface Column<T> {
  header: string | ((fieldName: keyof T, data?: any) => React.ReactNode);
  fieldName: keyof T;
  accessor: keyof T | ((data: T) => React.ReactNode);
  className?: string;
  sortable?: boolean;
  filterable?: boolean;
  hidden?: boolean;
  canNotHide?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  actions?: (item: T) => React.ReactNode;
  pageSize?: number;
  searchable?: boolean;
  hideColumnFilter?: boolean;
  hidePagination?: boolean;
  isLoading?: boolean;
  columnVisibility?: { [key: string]: boolean };
  onColumnVisibilityChange?: (visibility: { [key: string]: boolean }) => void;
  onSearch?: (s: string) => void;
  totalRecords?: number;
  containerClass?: string;
  currentPage?: number;
  scrollHeight?: number;
  setPagination?: Dispatch<SetStateAction<{ page: number; limit: number }>>;
  setSortOrder?: Dispatch<
    SetStateAction<{ key: keyof T | null; direction: SortDirection } | null>
  >;
  sortOrder?: { key: keyof T | null; direction: SortDirection } | null;
  containerRef?: MutableRefObject<any>;
  extraTemplate?: React.ReactNode;
  onRowClick?: (d: any) => void;
  equalColumnWidth?: boolean; // New prop for equal column widths
}
type SortDirection = "asc" | "desc" | null;

export function DataTable<T = any>({
  columns,
  data,
  actions,
  scrollHeight,
  containerClass,
  pageSize = 10,
  searchable = true,
  isLoading = false,
  onColumnVisibilityChange,
  onSearch = (s: string) => {},
  totalRecords = 0,
  currentPage = 1,
  setPagination,
  setSortOrder,
  sortOrder = null,
  hideColumnFilter = false,
  hidePagination = false,
  extraTemplate,
  onRowClick,
  equalColumnWidth = false, // Default to false
}: DataTableProps<T>) {
  // const [sortConfig, setSortConfig] = useState<{
  //   key: keyof T | null;
  //   direction: SortDirection;
  // }>({ key: null, direction: null });
  const [filters, setFilters] = useState<Record<string, string>>({});

  const [visibility, setVisibility] = useState<{ [key: string]: boolean }>(
    columns.reduce(
      (acc, column) => ({
        ...acc,
        [column.fieldName]: true,
      }),
      {},
    ),
  );

  const toggleColumnVisibility = (key: string) => {
    const newVisibility = {
      ...visibility,
      [key]: !visibility[key],
    };
    setVisibility(newVisibility);
    onColumnVisibilityChange?.(newVisibility);
  };

  // Handle sorting
  const handleSort = (fieldName: string) => {
    const conf = {
      key: fieldName,
      direction:
        sortOrder?.key === fieldName && sortOrder?.direction === "asc"
          ? "desc"
          : sortOrder?.direction === "desc"
            ? null
            : "asc",
    };
    setSortOrder && setSortOrder((conf.direction ? conf : null) as any);
  };

  // Handle filtering
  const handleFilter = (column: keyof T, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [column as string]: value,
    }));
  };

  // Apply filters, search, and sorting
  // useEffect(() => {
  //   let result = [...data];
  //
  //   // Apply search
  //   if (searchTerm) {
  //     result = result.filter((item: any) =>
  //       Object.values(item).some((value) =>
  //         String(value).toLowerCase().includes(searchTerm.toLowerCase()),
  //       ),
  //     );
  //   }
  //
  //   // Apply filters
  //   Object.entries(filters).forEach(([key, value]) => {
  //     if (value) {
  //       result = result.filter((item) =>
  //         String(item[key as keyof T])
  //           .toLowerCase()
  //           .includes(value.toLowerCase()),
  //       );
  //     }
  //   });
  //
  //   // Apply sorting
  //   if (sortConfig.key && sortConfig.direction) {
  //     result.sort((a, b) => {
  //       const aValue = a[sortConfig.key as keyof T];
  //       const bValue = b[sortConfig.key as keyof T];
  //
  //       if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
  //       if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
  //       return 0;
  //     });
  //   }
  //
  //   setFilteredData(result);
  //   setCurrentPage(1);
  // }, [data, searchTerm, filters, sortConfig]);
  // Calculate column width based on equalColumnWidth prop

  const getColumnWidth = () => {
    if (!equalColumnWidth) return undefined;

    const visibleColumns = columns.filter((column) => {
      const key = column.fieldName;
      return !(key in visibility) || visibility[key as string];
    });
    const totalColumns = visibleColumns.length + (actions ? 1 : 0);
    return `${100 / totalColumns}%`;
  };

  // Pagination
  const totalPages = Math.ceil(totalRecords / pageSize);

  const renderSortIcon = (column: Column<T>) => {
    if (!column.sortable) return null;
    const fieldName = column.fieldName as keyof T;
    if (sortOrder?.key === fieldName) {
      return sortOrder?.direction === "asc" ? (
        <ChevronUp className="w-4 h-4" />
      ) : sortOrder?.direction === "desc" ? (
        <ChevronDown className="w-4 h-4" />
      ) : (
        <ChevronsUpDown className="w-4 h-4" />
      );
    }
    return <ChevronsUpDown className="w-4 h-4" />;
  };

  return (
    <div className="space-y-4 max-h-full max-w-full h-full w-full flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {searchable && (
            <Command className="max-w-[220px] border border-[#d9d9d9]">
              <CommandInput
                placeholder="Search..."
                className="h-9"
                onValueChange={(e) => onSearch(e)}
              />
            </Command>
          )}
          {extraTemplate || <></>}
        </div>
        {!hideColumnFilter && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto font-normal">
                Columns <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {columns
                .filter((c) => !c.canNotHide)
                .map((column) => {
                  const key = column.fieldName;
                  return (
                    <DropdownMenuCheckboxItem
                      key={`ddm-item-${key as string}`}
                      className="capitalize"
                      checked={!(key in visibility) || visibility[key]}
                      onCheckedChange={() =>
                        toggleColumnVisibility(key as string)
                      }
                    >
                      {typeof column.header === "function"
                        ? column.header(column.fieldName)
                        : column.header}
                    </DropdownMenuCheckboxItem>
                  );
                })}
              {/* {columns
              .filter((column) => !column.canNotHide)
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={`col-${column.header}`}
                    className="capitalize"
                    checked={!column.hidden}
                    onCheckedChange={(value) => {
                      column.hidden = !column.hidden;
                    }}
                  >
                    {column.header}
                  </DropdownMenuCheckboxItem>
                );
              })} */}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div
        className={`border border-[#d9d9d9] max-h-full max-w-full overflow-hidden rounded-md flex-grow ${!searchable && hideColumnFilter ? "!mt-0" : ""} ${containerClass}`}
      >
        <ScrollArea
          className="h-full w-full"
          style={
            {
              height: scrollHeight
                ? scrollHeight -
                  (hidePagination ? 0 : 57) - // pagination
                  (searchable || !hideColumnFilter ? 55 : 0) // filter header
                : undefined,
              "--radix-scroll-area-viewport-overflow": "auto",
            } as any
          }
        >
          <div className="min-w-full inline-block">
            <Table
              className="relative max-h-full max-w-full"
              style={equalColumnWidth ? { tableLayout: "fixed" } : undefined}
            >
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  {columns.map((column, index) => {
                    const key = column.fieldName;
                    if (key in visibility && !visibility[key as string])
                      return null;
                    return (
                      <TableHead
                        key={`th-${index}`}
                        className={`px-2.5 py-3.5 ${column.className} ${
                          column.sortable && !isLoading ? "cursor-pointer" : ""
                        } whitespace-nowrap`}
                        style={
                          equalColumnWidth
                            ? { width: getColumnWidth() }
                            : undefined
                        }
                        onClick={() =>
                          !isLoading &&
                          column.sortable &&
                          handleSort(column.fieldName as string)
                        }
                      >
                        <div className="flex items-center gap-2">
                          {typeof column.header === "function"
                            ? column.header(column.fieldName)
                            : column.header}
                          {!isLoading && renderSortIcon(column)}
                        </div>
                        {!isLoading && column.filterable && (
                          <Input
                            placeholder={`Filter ${column.header}`}
                            className="mt-2"
                            onChange={(e) =>
                              handleFilter(
                                column.fieldName as keyof T,
                                e.target.value,
                              )
                            }
                          />
                        )}
                      </TableHead>
                    );
                  })}
                  {actions && (
                    <TableHead
                      className="whitespace-nowrap"
                      style={
                        equalColumnWidth
                          ? { width: getColumnWidth() }
                          : undefined
                      }
                    >
                      Actions
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody className="overflow-y-auto">
                {isLoading ? (
                  <TableSkeleton
                    columns={actions ? columns.length + 1 : columns.length}
                    rows={pageSize}
                  />
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={actions ? columns.length + 1 : columns.length}
                      className="h-24 text-center"
                    >
                      No results found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item, rowIndex) => (
                    <TableRow
                      key={`row-${rowIndex}`}
                      onClick={() => {
                        onRowClick?.(item);
                      }}
                      className={onRowClick ? "cursor-pointer" : ""}
                    >
                      {columns.map((column, colIndex) => {
                        const key = column.fieldName;
                        if (key in visibility && !visibility[key as string])
                          return null;
                        return (
                          <TableCell
                            className="p-2.5"
                            key={`col-${colIndex}`}
                            style={
                              equalColumnWidth
                                ? { width: getColumnWidth() }
                                : undefined
                            }
                          >
                            {typeof column.accessor === "function"
                              ? column.accessor(item)
                              : ((item[column.accessor] ||
                                  "-") as React.ReactNode)}
                          </TableCell>
                        );
                      })}
                      {actions && (
                        <TableCell
                          className="p-2.5"
                          style={
                            equalColumnWidth
                              ? { width: getColumnWidth() }
                              : undefined
                          }
                        >
                          {actions(item)}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </div>
      {!hidePagination && (
        <div className="flex items-center justify-between p-3 !mt-0">
          <div className="text-sm text-gray-500">
            {!isLoading && (
              <>
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, totalRecords)} of{" "}
                {totalRecords} entries
              </>
            )}
          </div>
          {!isLoading && (
            <Pagination className="w-fit mx-0">
              <PaginationContent className="h-[32px]">
                <PaginationItem className="flex items-center gap-1">
                  <span className="text-[#18181B] text-sm">
                    Result per page
                  </span>
                  <Select
                    defaultValue={pageSize?.toString()}
                    onValueChange={(e) => {
                      setPagination &&
                        setPagination((prev) => ({
                          ...prev,
                          limit: Number(e),
                        }));
                    }}
                  >
                    <SelectTrigger className="!mt-0 !h-8 border-[#d9d9d9] w-fit flex gap-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {["10", "20", "30", "50"].map((item: any, inx) => (
                          <SelectItem key={`size-${inx}`} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </PaginationItem>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() =>
                      currentPage !== 1 &&
                      setPagination &&
                      setPagination((prev) => ({
                        ...prev,
                        page: Math.max(1, prev.page - 1),
                      }))
                    }
                    className={
                      currentPage === 1
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <PaginationItem key={`page-inx-${page}`}>
                      <PaginationLink
                        isActive={currentPage === page}
                        className={
                          currentPage === page
                            ? "bg-primary text-[#fff]"
                            : "cursor-pointer"
                        }
                        onClick={() =>
                          currentPage !== page &&
                          setPagination &&
                          setPagination((prev) => ({
                            ...prev,
                            page,
                          }))
                        }
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}
                {/*<PaginationItem>*/}
                {/*  <PaginationEllipsis />*/}
                {/*</PaginationItem>*/}
                <PaginationItem>
                  {!(isLoading || currentPage === totalPages) ? (
                    <PaginationNext
                      className="cursor-pointer"
                      onClick={() =>
                        setPagination &&
                        setPagination((prev) => ({
                          ...prev,
                          page: Math.max(1, prev.page + 1),
                        }))
                      }
                    />
                  ) : (
                    <PaginationNext
                      onClick={(e) => e.preventDefault()}
                      className="cursor-not-allowed opacity-50"
                    />
                  )}
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}

      {/*/!* Pagination *!/*/}
      {/*<div className="flex items-center justify-between">*/}
      {/*  <div className="text-sm text-gray-500">*/}
      {/*    {!isLoading && (*/}
      {/*      <>*/}
      {/*        Showing {(currentPage - 1) * pageSize + 1} to{" "}*/}
      {/*        {Math.min(currentPage * pageSize, totalRecords)} of{" "}*/}
      {/*        {totalRecords} entries*/}
      {/*      </>*/}
      {/*    )}*/}
      {/*  </div>*/}
      {/*  <div className="flex items-center gap-2">*/}
      {/*    <Button*/}
      {/*      variant="outline"*/}
      {/*      className="!rounded-full"*/}
      {/*      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}*/}
      {/*      disabled={currentPage === 1}*/}
      {/*    >*/}
      {/*      Previous*/}
      {/*    </Button>*/}
      {/*    <div className="flex items-center gap-1">*/}
      {/*      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (*/}
      {/*        <Button*/}
      {/*          key={page}*/}
      {/*          variant={currentPage === page ? "primary" : "outline"}*/}
      {/*          className="!rounded-full"*/}
      {/*          disabled={isLoading}*/}
      {/*          onClick={() => setCurrentPage(page)}*/}
      {/*        >*/}
      {/*          {page}*/}
      {/*        </Button>*/}
      {/*      ))}*/}
      {/*    </div>*/}
      {/*    <Button*/}
      {/*      variant="outline"*/}
      {/*      className="!rounded-full"*/}
      {/*      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}*/}
      {/*      disabled={isLoading || currentPage === totalPages}*/}
      {/*    >*/}
      {/*      Next*/}
      {/*    </Button>*/}
      {/*  </div>*/}
      {/*</div>*/}
    </div>
  );
}
