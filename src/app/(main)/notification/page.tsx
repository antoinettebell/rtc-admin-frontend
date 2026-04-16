"use client";
import { LoaderCircle } from "lucide-react";
import * as React from "react";
import { useState } from "react";
import { Column, DataTable } from "@/components/ui/data-table";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback/use-debounced-callback";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { notificationApiService } from "@/services/notification-api-service";
import dayjs from "dayjs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Notification {
  _id: string;
  title: string;
  description: string;
  recipientType: string;
  sentTo: string[];
  createdAt: string;
}

export default function Notifications() {
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    recipientType: "",
    title: "",
    description: "",
  });

  const {
    data: result,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["notification-list", pagination.page, pagination.limit, searchTerm],
    queryFn: () =>
      notificationApiService.list(searchTerm, pagination.page, pagination.limit).then((res) => {
        console.log("Notification API Response:", res);
        return res;
      }),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setSearchTerm(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, 500);

  const columns: Column<Notification>[] = [
    {
      header: "Title",
      fieldName: "title",
      accessor: (d) => d.title || "-",
    },
    {
      header: "Description",
      fieldName: "description",
      accessor: (d) => d.description || "-",
    },
    {
      header: "Recipient Type",
      fieldName: "recipientType",
      accessor: (d) => d.recipientType || "-",
    },
    {
      header: "Users Count",
      fieldName: "sentTo",
      accessor: (d) => d.sentTo?.length || 0,
    },
    {
      header: "Date & Time",
      fieldName: "createdAt",
      accessor: (d) =>
        d.createdAt ? dayjs(d.createdAt).format("DD MMM, YYYY hh:mm A") : "-",
    },
  ];

  const handleSendNotification = () => {
    if (!formData.recipientType || !formData.title || !formData.description) {
      toast.error("All fields are required");
      return;
    }

    setSending(true);
    notificationApiService
      .send(formData)
      .then(() => {
        toast.success("Notification sent successfully");
        setShowModal(false);
        setFormData({ recipientType: "", title: "", description: "" });
        refetch();
      })
      .catch((e) => {
        toast.error(e.response?.data?.message || "Error sending notification");
      })
      .finally(() => setSending(false));
  };

  return (
    <>
      <div className="flex justify-between">
        <div className="font-semibold text-[28px] leading-[42px] mb-2">
          Notifications
        </div>
        <Button onClick={() => setShowModal(true)}>Send Notification</Button>
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
      />

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Recipient Type</Label>
              <Select
                value={formData.recipientType}
                onValueChange={(value) =>
                  setFormData({ ...formData, recipientType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select recipient type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL_USERS">All Users</SelectItem>
                  <SelectItem value="ALL_VENDORS">All Vendors</SelectItem>
                  <SelectItem value="ALL_CUSTOMERS">All Customers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Enter title"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter description"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                disabled={sending}
              >
                Cancel
              </Button>
              <Button onClick={handleSendNotification} disabled={sending}>
                Send
                {sending && <LoaderCircle size={16} className="animate-spin ml-2" />}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
