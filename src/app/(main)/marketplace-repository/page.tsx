"use client";

import * as React from "react";
import { useState } from "react";
import dayjs from "dayjs";
import {
  Ban,
  CheckCircle,
  Download,
  Eye,
  Flag,
  FolderArchive,
  ImageOff,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Column, DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
  MarketplaceRepositoryEvent,
  MarketplaceRepositoryFile,
  MarketplaceSubmission,
  marketplaceApiService,
} from "@/services/marketplace-api-service";
import { userApiService } from "@/services/user-api-service";

const fileTypeLabels: Record<string, string> = {
  EVENT_IMAGE: "Event Image",
  BID_MENU_PDF: "Menu PDF",
  BID_IMAGE: "Bid Image",
  PERMIT_LICENSE: "Permit/License",
  REQUIREMENT_DOCUMENT: "Requirement",
  AGREEMENT_DOCUMENT: "Signed Agreement",
};

const formatBytes = (value?: number | null) => {
  const bytes = Number(value || 0);
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getPersonName = (user: any) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
  user?.email ||
  "-";

const getFoodTruckName = (submission: MarketplaceSubmission) => {
  const truck = submission.food_truck_id;
  if (truck?.name) return truck.name;
  const vendor = submission.vendor_user_id;
  return getPersonName(vendor);
};

const isBidAwardable = (submission: MarketplaceSubmission) =>
  !!submission.bid_id &&
  ["SUBMITTED", "UNDER_REVIEW"].includes(String(submission.bid_status || ""));

const eventStatuses = ["DRAFT", "OPEN", "REOPENED", "CLOSED", "AWARDED", "CANCELLED"];

type EventDraft = {
  event_name: string;
  event_description: string;
  ticket_sales_enabled: boolean;
  ticket_url: string;
};

type NewEventDraft = EventDraft & {
  customer_user_id: string;
  event_type: string;
  event_visibility: "PUBLIC" | "PRIVATE";
  event_date: string;
  event_time: string;
  event_address: string;
  event_city: string;
  event_state: string;
  event_zip: string;
  number_of_guests: string;
  number_of_vendors_needed: string;
  payment_responsibility: "COORDINATOR" | "VENDOR" | "BOTH" | "NONE";
  vendor_fee: string;
  budgeted_amount: string;
  event_close_date: string;
  event_close_time: string;
  status: string;
};

const emptyNewEventDraft: NewEventDraft = {
  customer_user_id: "",
  event_name: "",
  event_description: "",
  ticket_sales_enabled: false,
  ticket_url: "",
  event_type: "Food Truck Event",
  event_visibility: "PRIVATE",
  event_date: "",
  event_time: "",
  event_address: "",
  event_city: "",
  event_state: "",
  event_zip: "",
  number_of_guests: "",
  number_of_vendors_needed: "1",
  payment_responsibility: "NONE",
  vendor_fee: "0",
  budgeted_amount: "0",
  event_close_date: "",
  event_close_time: "",
  status: "DRAFT",
};

export default function MarketplaceRepositoryPage() {
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [eventPagination, setEventPagination] = useState({ page: 1, limit: 10 });
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [eventStatus, setEventStatus] = useState("");
  const [eventSearch, setEventSearch] = useState("");
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventDrafts, setEventDrafts] = useState<Record<string, EventDraft>>({});
  const [selectedBidIds, setSelectedBidIds] = useState<Record<string, string[]>>({});
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [newEvent, setNewEvent] = useState<NewEventDraft>(emptyNewEventDraft);

  const { data: eventResult, isFetching: isFetchingEvents, refetch: refetchEvents } =
    useQuery({
      queryKey: [
        "marketplace-repository-events",
        eventPagination.page,
        eventPagination.limit,
        eventStatus,
        eventSearch,
      ],
      queryFn: () =>
        marketplaceApiService.listRepositoryEvents({
          page: eventPagination.page,
          limit: eventPagination.limit,
          ...(eventStatus ? { status: eventStatus } : {}),
          ...(eventSearch.trim() ? { search: eventSearch.trim() } : {}),
        }),
      staleTime: 0,
      refetchOnWindowFocus: false,
    });

  const { data: coordinatorResult } = useQuery({
    queryKey: ["marketplace-event-coordinators-for-events"],
    queryFn: () => userApiService.listEventCoordinators(1, "enabled", "", 100),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

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

  const events = eventResult?.data?.data?.records || [];
  const eventTotal = eventResult?.data?.data?.total || 0;
  const coordinators = coordinatorResult?.data?.data?.records || [];

  const startEditEvent = (event: MarketplaceRepositoryEvent) => {
    setEditingEventId(event.event_id);
    setEventDrafts((prev) => ({
      ...prev,
      [event.event_id]: {
        event_name: event.event_name || "",
        event_description: event.event_description || "",
        ticket_sales_enabled: !!event.ticket_sales_enabled,
        ticket_url: event.ticket_url || "",
      },
    }));
  };

  const updateEventDraft = (
    eventId: string,
    field: keyof EventDraft,
    value: string | boolean,
  ) => {
    setEventDrafts((prev) => ({
      ...prev,
      [eventId]: {
        ...(prev[eventId] || {
          event_name: "",
          event_description: "",
          ticket_sales_enabled: false,
          ticket_url: "",
        }),
        [field]: value,
      },
    }));
  };

  const saveEvent = async (event: MarketplaceRepositoryEvent) => {
    const draft = eventDrafts[event.event_id];
    if (!draft) return;
    setUpdatingId(event.event_id);
    try {
      await marketplaceApiService.updateRepositoryEvent(event.event_id, draft);
      toast.success("Marketplace event updated");
      setEditingEventId(null);
      refetchEvents();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to update event");
    } finally {
      setUpdatingId(null);
    }
  };

  const createEvent = async () => {
    if (!newEvent.customer_user_id || !newEvent.event_name.trim()) {
      toast.error("Select a coordinator and enter an event name.");
      return;
    }
    setUpdatingId("create-event");
    try {
      await marketplaceApiService.createRepositoryEvent({
        ...newEvent,
        number_of_guests: newEvent.number_of_guests
          ? Number(newEvent.number_of_guests)
          : null,
        number_of_vendors_needed: newEvent.number_of_vendors_needed
          ? Number(newEvent.number_of_vendors_needed)
          : null,
        vendor_fee: Number(newEvent.vendor_fee || 0),
        budgeted_amount: Number(newEvent.budgeted_amount || 0),
      });
      toast.success("Marketplace event created");
      setNewEvent(emptyNewEventDraft);
      setCreatingEvent(false);
      refetchEvents();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to create event");
    } finally {
      setUpdatingId(null);
    }
  };

  const updateEventStatus = async (
    event: MarketplaceRepositoryEvent,
    status: string,
  ) => {
    const label = status === "CANCELLED" ? "reject/cancel" : `mark ${status}`;
    if (!window.confirm(`Are you sure you want to ${label} this event?`)) return;
    setUpdatingId(`${event.event_id}-${status}`);
    try {
      await marketplaceApiService.updateEventStatus(event.event_id, status);
      toast.success(`Event marked ${status}`);
      refetchEvents();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to update event status");
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteEventImage = async (
    event: MarketplaceRepositoryEvent,
    imageId: string,
  ) => {
    if (!window.confirm("Remove this event image?")) return;
    setUpdatingId(imageId);
    try {
      await marketplaceApiService.deleteEventImage(event.event_id, imageId);
      toast.success("Event image removed");
      refetchEvents();
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to remove image");
    } finally {
      setUpdatingId(null);
    }
  };

  const withdrawSubmission = async (
    event: MarketplaceRepositoryEvent,
    submission: MarketplaceSubmission,
  ) => {
    const isBid = !!submission.bid_id;
    const submissionId = submission.bid_id || submission.application_id;
    if (!submissionId) return;
    const reason = window.prompt("Reason for withdrawing this vendor?");
    if (!reason?.trim()) return;
    setUpdatingId(submissionId);
    try {
      await marketplaceApiService.withdrawSubmission(event.event_id, {
        submission_type: isBid ? "BID" : "APPLICATION",
        submission_id: submissionId,
        reason: reason.trim(),
      });
      toast.success("Vendor submission withdrawn");
      refetchEvents();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to withdraw vendor");
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleAwardBid = (eventId: string, bidId: string) => {
    setSelectedBidIds((prev) => {
      const current = prev[eventId] || [];
      return {
        ...prev,
        [eventId]: current.includes(bidId)
          ? current.filter((id) => id !== bidId)
          : [...current, bidId],
      };
    });
  };

  const awardEventBids = async (event: MarketplaceRepositoryEvent) => {
    const bidIds = selectedBidIds[event.event_id] || [];
    if (!bidIds.length) {
      toast.error("Select at least one submitted bid to award.");
      return;
    }
    if (!window.confirm("Award the selected vendor bid(s) for this event?")) return;
    setUpdatingId(`${event.event_id}-award`);
    try {
      const response = await marketplaceApiService.awardRepositoryEvent(
        event.event_id,
        bidIds,
      );
      toast.success(
        response.data?.data?.requires_payment
          ? "Award fee payment is pending for the coordinator."
          : "Marketplace event awarded.",
      );
      setSelectedBidIds((prev) => ({ ...prev, [event.event_id]: [] }));
      refetchEvents();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to award event");
    } finally {
      setUpdatingId(null);
    }
  };

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

  const eventColumns: Column<MarketplaceRepositoryEvent>[] = [
    {
      header: "Event",
      fieldName: "event_name",
      accessor: (event) => (
        <div className="min-w-[280px] space-y-2">
          {editingEventId === event.event_id ? (
            <>
              <input
                className="h-9 w-full rounded-md border px-3 text-sm"
                value={eventDrafts[event.event_id]?.event_name || ""}
                onChange={(e) =>
                  updateEventDraft(event.event_id, "event_name", e.target.value)
                }
              />
              <textarea
                className="min-h-[90px] w-full rounded-md border px-3 py-2 text-sm"
                value={eventDrafts[event.event_id]?.event_description || ""}
                onChange={(e) =>
                  updateEventDraft(
                    event.event_id,
                    "event_description",
                    e.target.value,
                  )
                }
              />
            </>
          ) : (
            <>
              <div className="font-medium">{event.event_name || "-"}</div>
              <div className="text-xs text-muted-foreground">
                {event.event_description || "No description"}
              </div>
            </>
          )}
          <div className="text-xs text-muted-foreground break-all">
            {event.event_id}
          </div>
        </div>
      ),
      canNotHide: true,
      className: "w-[340px]",
    },
    {
      header: "Coordinator",
      fieldName: "customer_user_id",
      accessor: (event) => (
        <div>
          <div>{getPersonName(event.customer_user_id)}</div>
          <div className="text-xs text-muted-foreground">
            {event.customer_user_id?.email || event.customer_user_id || "-"}
          </div>
        </div>
      ),
    },
    {
      header: "When",
      fieldName: "event_date",
      accessor: (event) => (
        <div className="text-sm">
          <div>
            {event.event_date ? dayjs(event.event_date).format("YYYY-MM-DD") : "-"}
          </div>
          <div className="text-xs text-muted-foreground">
            {[event.event_city, event.event_state].filter(Boolean).join(", ") || "-"}
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      fieldName: "status",
      accessor: (event) => (
        <span className="rounded-full border px-2 py-1 text-xs font-medium">
          {event.status}
        </span>
      ),
    },
    {
      header: "Tickets",
      fieldName: "ticket_url",
      accessor: (event) =>
        editingEventId === event.event_id ? (
          <div className="min-w-[240px] space-y-2">
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={!!eventDrafts[event.event_id]?.ticket_sales_enabled}
                onChange={(e) =>
                  updateEventDraft(
                    event.event_id,
                    "ticket_sales_enabled",
                    e.target.checked,
                  )
                }
              />
              Ticket sales enabled
            </label>
            <input
              className="h-9 w-full rounded-md border px-3 text-sm"
              placeholder="Ticket URL"
              value={eventDrafts[event.event_id]?.ticket_url || ""}
              onChange={(e) =>
                updateEventDraft(event.event_id, "ticket_url", e.target.value)
              }
            />
          </div>
        ) : event.ticket_url ? (
          <a
            href={event.ticket_url}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline"
          >
            Open tickets
          </a>
        ) : (
          "-"
        ),
    },
    {
      header: "Images",
      fieldName: "images",
      accessor: (event) => (
        <div className="flex max-w-[240px] flex-wrap gap-2">
          {(event.images || []).length ? (
            (event.images || []).map((image) => (
              <div
                key={image.image_id}
                className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
              >
                <a
                  href={image.image_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline"
                >
                  Image
                </a>
                <Button
                  size="xs"
                  variant="ghost"
                  disabled={updatingId === image.image_id}
                  onClick={() => deleteEventImage(event, image.image_id)}
                >
                  <ImageOff className="h-3 w-3" />
                </Button>
              </div>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">No images</span>
          )}
        </div>
      ),
    },
    {
      header: "Vendors",
      fieldName: "bids",
      accessor: (event) => {
        const submissions = [
          ...(event.bids || []),
          ...(event.applications || []),
        ];
        return (
          <div className="min-w-[300px] space-y-2">
            {!submissions.length ? (
              <div className="text-xs text-muted-foreground">No submissions</div>
            ) : null}
            {submissions.map((submission) => {
              const isBid = !!submission.bid_id;
              const submissionId = submission.bid_id || submission.application_id || "";
              const status = submission.bid_status || submission.application_status || "-";
              const selected = (selectedBidIds[event.event_id] || []).includes(
                submissionId,
              );
              return (
                <div
                  key={`${isBid ? "bid" : "application"}-${submissionId}`}
                  className="rounded-md border p-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">{getFoodTruckName(submission)}</div>
                      <div className="text-muted-foreground">
                        {isBid ? "Bid" : "Application"}: {status}
                      </div>
                    </div>
                    {isBidAwardable(submission) ? (
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleAwardBid(event.event_id, submissionId)}
                        />
                        Award
                      </label>
                    ) : null}
                  </div>
                  <Button
                    size="xs"
                    variant="outline"
                    className="mt-2"
                    disabled={
                      updatingId === submissionId ||
                      ["AWARDED", "ACCEPTED", "PAYMENT_DUE", "PAID", "CONFIRMED", "WITHDRAWN"].includes(
                        String(status),
                      )
                    }
                    onClick={() => withdrawSubmission(event, submission)}
                  >
                    Withdraw
                  </Button>
                </div>
              );
            })}
            {(event.bids || []).some(isBidAwardable) ? (
              <Button
                size="sm"
                disabled={updatingId === `${event.event_id}-award`}
                onClick={() => awardEventBids(event)}
              >
                <CheckCircle className="mr-1 h-4 w-4" /> Award Selected
              </Button>
            ) : null}
          </div>
        );
      },
    },
  ];

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
      header: "Submission",
      fieldName: "bid_id",
      accessor: (file) => file.bid_id || file.application_id || "-",
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
          Manage marketplace events, vendor submissions, event images, bid menus,
          food images, permit/license documents, and signed agreements.
        </p>
      </div>

      <div className="rounded-md border bg-white p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Marketplace Events</h2>
            <p className="text-sm text-muted-foreground">
              Create events for existing coordinators, make minor edits, remove
              images, reject events, withdraw vendors, and award bids.
            </p>
          </div>
          <Button onClick={() => setCreatingEvent((value) => !value)}>
            {creatingEvent ? (
              <>
                <X className="mr-1 h-4 w-4" /> Cancel
              </>
            ) : (
              <>
                <Plus className="mr-1 h-4 w-4" /> Create Event
              </>
            )}
          </Button>
        </div>

        {creatingEvent ? (
          <div className="mb-4 rounded-md border bg-slate-50 p-4">
            <div className="grid gap-3 md:grid-cols-3">
              <label className="text-sm">
                Coordinator
                <select
                  className="mt-1 h-10 w-full rounded-md border bg-white px-3"
                  value={newEvent.customer_user_id}
                  onChange={(e) =>
                    setNewEvent((prev) => ({
                      ...prev,
                      customer_user_id: e.target.value,
                    }))
                  }
                >
                  <option value="">Select coordinator</option>
                  {coordinators.map((coordinator: any) => (
                    <option key={coordinator._id} value={coordinator._id}>
                      {getPersonName(coordinator)} - {coordinator.email}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                Event Name
                <input
                  className="mt-1 h-10 w-full rounded-md border bg-white px-3"
                  value={newEvent.event_name}
                  onChange={(e) =>
                    setNewEvent((prev) => ({
                      ...prev,
                      event_name: e.target.value,
                    }))
                  }
                />
              </label>
              <label className="text-sm">
                Status
                <select
                  className="mt-1 h-10 w-full rounded-md border bg-white px-3"
                  value={newEvent.status}
                  onChange={(e) =>
                    setNewEvent((prev) => ({ ...prev, status: e.target.value }))
                  }
                >
                  <option value="DRAFT">Draft</option>
                  <option value="OPEN">Open</option>
                </select>
              </label>
              <label className="text-sm md:col-span-3">
                Description
                <textarea
                  className="mt-1 min-h-[90px] w-full rounded-md border bg-white px-3 py-2"
                  value={newEvent.event_description}
                  onChange={(e) =>
                    setNewEvent((prev) => ({
                      ...prev,
                      event_description: e.target.value,
                    }))
                  }
                />
              </label>
              <label className="text-sm">
                Event Date
                <input
                  type="date"
                  className="mt-1 h-10 w-full rounded-md border bg-white px-3"
                  value={newEvent.event_date}
                  onChange={(e) =>
                    setNewEvent((prev) => ({ ...prev, event_date: e.target.value }))
                  }
                />
              </label>
              <label className="text-sm">
                Event Time
                <input
                  type="time"
                  className="mt-1 h-10 w-full rounded-md border bg-white px-3"
                  value={newEvent.event_time}
                  onChange={(e) =>
                    setNewEvent((prev) => ({ ...prev, event_time: e.target.value }))
                  }
                />
              </label>
              <label className="text-sm">
                Close Date
                <input
                  type="date"
                  className="mt-1 h-10 w-full rounded-md border bg-white px-3"
                  value={newEvent.event_close_date}
                  onChange={(e) =>
                    setNewEvent((prev) => ({
                      ...prev,
                      event_close_date: e.target.value,
                    }))
                  }
                />
              </label>
              <label className="text-sm">
                Close Time
                <input
                  type="time"
                  className="mt-1 h-10 w-full rounded-md border bg-white px-3"
                  value={newEvent.event_close_time}
                  onChange={(e) =>
                    setNewEvent((prev) => ({
                      ...prev,
                      event_close_time: e.target.value,
                    }))
                  }
                />
              </label>
              <label className="text-sm">
                Guests
                <input
                  type="number"
                  min="1"
                  className="mt-1 h-10 w-full rounded-md border bg-white px-3"
                  value={newEvent.number_of_guests}
                  onChange={(e) =>
                    setNewEvent((prev) => ({
                      ...prev,
                      number_of_guests: e.target.value,
                    }))
                  }
                />
              </label>
              <label className="text-sm">
                Vendors Needed
                <input
                  type="number"
                  min="1"
                  className="mt-1 h-10 w-full rounded-md border bg-white px-3"
                  value={newEvent.number_of_vendors_needed}
                  onChange={(e) =>
                    setNewEvent((prev) => ({
                      ...prev,
                      number_of_vendors_needed: e.target.value,
                    }))
                  }
                />
              </label>
              <label className="text-sm md:col-span-2">
                Address
                <input
                  className="mt-1 h-10 w-full rounded-md border bg-white px-3"
                  value={newEvent.event_address}
                  onChange={(e) =>
                    setNewEvent((prev) => ({
                      ...prev,
                      event_address: e.target.value,
                    }))
                  }
                />
              </label>
              <label className="text-sm">
                City
                <input
                  className="mt-1 h-10 w-full rounded-md border bg-white px-3"
                  value={newEvent.event_city}
                  onChange={(e) =>
                    setNewEvent((prev) => ({ ...prev, event_city: e.target.value }))
                  }
                />
              </label>
              <label className="text-sm">
                State
                <input
                  className="mt-1 h-10 w-full rounded-md border bg-white px-3"
                  value={newEvent.event_state}
                  onChange={(e) =>
                    setNewEvent((prev) => ({ ...prev, event_state: e.target.value }))
                  }
                />
              </label>
              <label className="text-sm">
                Zip
                <input
                  className="mt-1 h-10 w-full rounded-md border bg-white px-3"
                  value={newEvent.event_zip}
                  onChange={(e) =>
                    setNewEvent((prev) => ({ ...prev, event_zip: e.target.value }))
                  }
                />
              </label>
              <label className="text-sm">
                Payment Responsibility
                <select
                  className="mt-1 h-10 w-full rounded-md border bg-white px-3"
                  value={newEvent.payment_responsibility}
                  onChange={(e) =>
                    setNewEvent((prev) => ({
                      ...prev,
                      payment_responsibility: e.target.value as NewEventDraft["payment_responsibility"],
                    }))
                  }
                >
                  <option value="NONE">None</option>
                  <option value="COORDINATOR">Coordinator</option>
                  <option value="VENDOR">Vendor</option>
                  <option value="BOTH">Both</option>
                </select>
              </label>
              <label className="text-sm">
                Vendor Fee
                <input
                  type="number"
                  min="0"
                  className="mt-1 h-10 w-full rounded-md border bg-white px-3"
                  value={newEvent.vendor_fee}
                  onChange={(e) =>
                    setNewEvent((prev) => ({ ...prev, vendor_fee: e.target.value }))
                  }
                />
              </label>
              <label className="text-sm">
                Budget Amount
                <input
                  type="number"
                  min="0"
                  className="mt-1 h-10 w-full rounded-md border bg-white px-3"
                  value={newEvent.budgeted_amount}
                  onChange={(e) =>
                    setNewEvent((prev) => ({
                      ...prev,
                      budgeted_amount: e.target.value,
                    }))
                  }
                />
              </label>
            </div>
            <div className="mt-3 flex justify-end">
              <Button
                onClick={createEvent}
                disabled={updatingId === "create-event"}
              >
                <Save className="mr-1 h-4 w-4" /> Save Event
              </Button>
            </div>
          </div>
        ) : null}

        <div className="mb-3 flex flex-wrap gap-2">
          <input
            className="h-10 min-w-[260px] rounded-md border px-3 text-sm"
            placeholder="Search events"
            value={eventSearch}
            onChange={(e) => {
              setEventSearch(e.target.value);
              setEventPagination((prev) => ({ ...prev, page: 1 }));
            }}
          />
          <select
            className="h-10 rounded-md border bg-white px-3 text-sm"
            value={eventStatus}
            onChange={(e) => {
              setEventStatus(e.target.value);
              setEventPagination((prev) => ({ ...prev, page: 1 }));
            }}
          >
            <option value="">All statuses</option>
            {eventStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <DataTable
          data={events}
          columns={eventColumns}
          isLoading={isFetchingEvents}
          totalRecords={eventTotal}
          currentPage={eventPagination.page}
          pageSize={eventPagination.limit}
          setPagination={setEventPagination}
          actions={(event) => (
            <div className="flex min-w-[210px] flex-wrap gap-1">
              {editingEventId === event.event_id ? (
                <>
                  <Button
                    size="sm"
                    onClick={() => saveEvent(event)}
                    disabled={updatingId === event.event_id}
                  >
                    <Save className="mr-1 h-4 w-4" /> Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingEventId(null)}
                  >
                    <X className="mr-1 h-4 w-4" /> Cancel
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={() => startEditEvent(event)}>
                  <Pencil className="mr-1 h-4 w-4" /> Edit
                </Button>
              )}
              {event.status !== "CANCELLED" && event.status !== "AWARDED" ? (
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={updatingId === `${event.event_id}-CANCELLED`}
                  onClick={() => updateEventStatus(event, "CANCELLED")}
                >
                  <Ban className="mr-1 h-4 w-4" /> Reject
                </Button>
              ) : null}
            </div>
          )}
        />
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
