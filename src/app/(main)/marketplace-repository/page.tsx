"use client";

import * as React from "react";
import { useState } from "react";
import dayjs from "dayjs";
import {
  Ban,
  CheckCircle,
  ImageOff,
  Pencil,
  Plus,
  Save,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Column, DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
  MarketplaceEventPayload,
  MarketplaceRepositoryEvent,
  MarketplaceSubmission,
  marketplaceApiService,
} from "@/services/marketplace-api-service";
import { userApiService } from "@/services/user-api-service";

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
const eventTypeOptions = [
  "Festival",
  "Wedding",
  "Corporate",
  "Private Party",
  "Fundraiser",
  "Conference",
  "Market",
  "Concert",
  "Other",
];
const eventStyleOptions = ["Casual", "Formal", "Themed"];
const serviceTypeOptions = [
  "Food Truck",
  "Full Service Catering",
  "Buffet",
  "Drop-off Catering",
  "Served Stations",
  "Beverage and Alcohol",
];
const primaryServiceStyleOptions = [
  "Plated",
  "Buffet",
  "Food Truck",
  "Family Style / Stations",
  "Other",
];
const permitOptions = [
  "None",
  "City Permit",
  "Food Vendor",
  "Sanitation Grade",
  "Alcohol",
];
const powerOptions = ["110v/15A", "110V/30A", "220V", "Generator OK"];
const cuisineOptions = ["BBQ", "Latin", "Vegan", "Soul/Caribbean", "Asian", "Kosher", "Halal"];
const dietaryOptions = [
  "No Pork",
  "Child-Friendly",
  "Vegetarian",
  "Vegan",
  "Gluten-free",
  "Nut Allergy",
];
const equipmentOptions = [
  "None",
  "Tents",
  "Tables",
  "Table Clothes",
  "Additional Staffing",
  "Chair Covers",
];

type EventDraft = {
  event_name: string;
  event_description: string;
  event_type: string;
  event_type_other: string;
  event_visibility: "PUBLIC" | "PRIVATE";
  event_style: string;
  service_type: string;
  service_types: string[];
  service_styles: string[];
  primary_service_style: string;
  event_date: string;
  event_time: string;
  event_duration_minutes: string;
  event_address: string;
  event_city: string;
  event_state: string;
  event_zip: string;
  latitude: string;
  longitude: string;
  formatted_address: string;
  number_of_guests: string;
  number_of_vendors_needed: string;
  power_required: string[];
  permits_required: string[];
  insurance_required: boolean;
  alcohol_required: boolean;
  free_food_offered: boolean | null;
  free_food_provider: string;
  vendors_required_to_giveaway_food: boolean | null;
  catered_vip_section_enabled: boolean;
  vip_guest_count: string;
  cuisine_preferences: string[];
  dietary_restrictions: string[];
  equipment_needed: string[];
  payment_responsibility: "COORDINATOR" | "VENDOR" | "BOTH" | "NONE";
  vendor_fee: string;
  budgeted_amount: string;
  event_close_date: string;
  event_close_time: string;
  status: string;
  ticket_sales_enabled: boolean;
  ticket_url: string;
};

type NewEventDraft = EventDraft & {
  customer_user_id: string;
};

const emptyEventDraft: EventDraft = {
  event_name: "",
  event_description: "",
  event_type: "",
  event_type_other: "",
  event_visibility: "PRIVATE",
  event_style: "",
  service_type: "",
  service_types: [],
  service_styles: [],
  primary_service_style: "",
  event_date: "",
  event_time: "",
  event_duration_minutes: "",
  event_address: "",
  event_city: "",
  event_state: "",
  event_zip: "",
  latitude: "",
  longitude: "",
  formatted_address: "",
  number_of_guests: "",
  number_of_vendors_needed: "1",
  power_required: [],
  permits_required: [],
  insurance_required: false,
  alcohol_required: false,
  free_food_offered: null,
  free_food_provider: "",
  vendors_required_to_giveaway_food: null,
  catered_vip_section_enabled: false,
  vip_guest_count: "",
  cuisine_preferences: [],
  dietary_restrictions: [],
  equipment_needed: [],
  payment_responsibility: "NONE",
  vendor_fee: "0",
  budgeted_amount: "0",
  event_close_date: "",
  event_close_time: "",
  status: "DRAFT",
  ticket_sales_enabled: false,
  ticket_url: "",
};

const emptyNewEventDraft: NewEventDraft = {
  ...emptyEventDraft,
  customer_user_id: "",
};

const normalizeDateInput = (value?: string | null) => {
  if (!value) return "";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : "";
};

const normalizeTimeInput = (value?: string | null) => {
  if (!value) return "";
  const match = String(value).match(/^(\d{1,2}):(\d{2})/);
  return match ? `${match[1].padStart(2, "0")}:${match[2]}` : "";
};

const normalizeArray = (value?: string[] | string | null) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [String(value)] : [];
};

const numberOrNull = (value: string) => {
  if (value === "" || value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const moneyOrZero = (value: string) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toEventDraft = (event: MarketplaceRepositoryEvent): EventDraft => ({
  ...emptyEventDraft,
  event_name: event.event_name || "",
  event_description: event.event_description || "",
  event_type: event.event_type || "",
  event_type_other: event.event_type_other || "",
  event_visibility: event.event_visibility === "PUBLIC" ? "PUBLIC" : "PRIVATE",
  event_style: event.event_style || "",
  service_type: event.service_type || "",
  service_types: normalizeArray(event.service_types?.length ? event.service_types : event.service_type),
  service_styles: normalizeArray(event.service_styles),
  primary_service_style: event.primary_service_style || "",
  event_date: normalizeDateInput(event.event_date),
  event_time: normalizeTimeInput(event.event_time),
  event_duration_minutes: event.event_duration_minutes != null ? String(event.event_duration_minutes) : "",
  event_address: event.event_address || "",
  event_city: event.event_city || "",
  event_state: event.event_state || "",
  event_zip: event.event_zip || "",
  latitude: event.latitude != null ? String(event.latitude) : "",
  longitude: event.longitude != null ? String(event.longitude) : "",
  formatted_address: event.formatted_address || "",
  number_of_guests: event.number_of_guests != null ? String(event.number_of_guests) : "",
  number_of_vendors_needed:
    event.number_of_vendors_needed != null ? String(event.number_of_vendors_needed) : "1",
  power_required: normalizeArray(event.power_required),
  permits_required: normalizeArray(event.permits_required).map((permit) =>
    permit === "Health Department" ? "Sanitation Grade" : permit,
  ),
  insurance_required: !!event.insurance_required,
  alcohol_required: !!event.alcohol_required,
  free_food_offered:
    event.free_food_offered === true || event.free_food_offered === false
      ? event.free_food_offered
      : null,
  free_food_provider: event.free_food_provider || "",
  vendors_required_to_giveaway_food:
    event.vendors_required_to_giveaway_food === true ||
    event.vendors_required_to_giveaway_food === false
      ? event.vendors_required_to_giveaway_food
      : null,
  catered_vip_section_enabled: !!event.catered_vip_section_enabled,
  vip_guest_count: event.vip_guest_count != null ? String(event.vip_guest_count) : "",
  cuisine_preferences: normalizeArray(event.cuisine_preferences),
  dietary_restrictions: normalizeArray(event.dietary_restrictions),
  equipment_needed: normalizeArray(event.equipment_needed),
  payment_responsibility: event.payment_responsibility || "NONE",
  vendor_fee: event.vendor_fee != null ? String(event.vendor_fee) : "0",
  budgeted_amount: event.budgeted_amount != null ? String(event.budgeted_amount) : "0",
  event_close_date: normalizeDateInput(event.event_close_date),
  event_close_time: normalizeTimeInput(event.event_close_time),
  status: event.status || "DRAFT",
  ticket_sales_enabled: !!event.ticket_sales_enabled,
  ticket_url: event.ticket_url || "",
});

const buildEventPayload = (draft: EventDraft): MarketplaceEventPayload => {
  const serviceTypes = normalizeArray(draft.service_types);
  const permits = normalizeArray(draft.permits_required).filter((permit) => permit !== "None");
  const foodTruckSelected = serviceTypes.includes("Food Truck");
  const primaryServiceStyle = foodTruckSelected
    ? "Food Truck"
    : draft.primary_service_style || null;

  return {
    event_name: draft.event_name,
    event_description: draft.event_description,
    event_type: draft.event_type,
    event_type_other: draft.event_type === "Other" ? draft.event_type_other : "",
    event_visibility: draft.event_visibility,
    event_style: draft.event_style,
    service_type: serviceTypes[0] || "",
    service_types: serviceTypes,
    service_styles: normalizeArray(draft.service_styles),
    primary_service_style: primaryServiceStyle,
    event_date: draft.event_date || null,
    event_time: draft.event_time || null,
    event_duration_hours: 0,
    event_duration_minutes: numberOrNull(draft.event_duration_minutes),
    event_address: draft.event_address,
    event_city: draft.event_city,
    event_state: draft.event_state,
    event_zip: draft.event_zip,
    latitude: numberOrNull(draft.latitude),
    longitude: numberOrNull(draft.longitude),
    formatted_address: draft.formatted_address || draft.event_address,
    number_of_guests: numberOrNull(draft.number_of_guests),
    number_of_vendors_needed: numberOrNull(draft.number_of_vendors_needed),
    power_required: normalizeArray(draft.power_required),
    permits_required: draft.alcohol_required && !permits.includes("Alcohol")
      ? [...permits, "Alcohol"]
      : permits,
    insurance_required: draft.insurance_required,
    alcohol_required: draft.alcohol_required,
    free_food_offered: draft.free_food_offered,
    free_food_provider: draft.free_food_offered ? draft.free_food_provider : "",
    vendors_required_to_giveaway_food: draft.free_food_offered
      ? draft.vendors_required_to_giveaway_food
      : null,
    catered_vip_section_enabled: draft.catered_vip_section_enabled,
    vip_guest_count: draft.catered_vip_section_enabled
      ? numberOrNull(draft.vip_guest_count)
      : 0,
    cuisine_preferences: normalizeArray(draft.cuisine_preferences),
    dietary_restrictions: normalizeArray(draft.dietary_restrictions),
    equipment_needed: normalizeArray(draft.equipment_needed),
    payment_responsibility: draft.payment_responsibility,
    vendor_fee: moneyOrZero(draft.vendor_fee),
    budgeted_amount: moneyOrZero(draft.budgeted_amount),
    event_close_date: draft.event_close_date || null,
    event_close_time: draft.event_close_time || null,
    status: draft.status,
    ticket_sales_enabled: draft.ticket_sales_enabled,
    ticket_url: draft.ticket_sales_enabled ? draft.ticket_url : "",
  };
};

export default function MarketplaceRepositoryPage() {
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

  const events = eventResult?.data?.data?.records || [];
  const eventTotal = eventResult?.data?.data?.total || 0;
  const coordinators = coordinatorResult?.data?.data?.records || [];

  const startEditEvent = (event: MarketplaceRepositoryEvent) => {
    setEditingEventId(event.event_id);
    setEventDrafts((prev) => ({
      ...prev,
      [event.event_id]: toEventDraft(event),
    }));
  };

  const updateEventDraft = (
    eventId: string,
    field: keyof EventDraft,
    value: string | boolean | string[] | null,
  ) => {
    setEventDrafts((prev) => ({
      ...prev,
      [eventId]: {
        ...(prev[eventId] || emptyEventDraft),
        [field]: value,
      },
    }));
  };

  const updateNewEvent = (
    field: keyof NewEventDraft,
    value: string | boolean | string[] | null,
  ) => {
    setNewEvent((prev) => ({ ...prev, [field]: value }));
  };

  const saveEvent = async (event: MarketplaceRepositoryEvent) => {
    const draft = eventDrafts[event.event_id];
    if (!draft) return;
    setUpdatingId(event.event_id);
    try {
      await marketplaceApiService.updateRepositoryEvent(
        event.event_id,
        buildEventPayload(draft),
      );
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
        ...buildEventPayload(newEvent),
        customer_user_id: newEvent.customer_user_id,
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

  const toggleDraftArray = (
    draft: EventDraft,
    onChange: (field: keyof EventDraft, value: string | boolean | string[] | null) => void,
    field: keyof EventDraft,
    option: string,
  ) => {
    const current = normalizeArray(draft[field] as string[] | string);
    const next = current.includes(option)
      ? current.filter((item) => item !== option)
      : [...current, option];

    if (field === "service_types" && option === "Food Truck" && !current.includes(option)) {
      onChange("primary_service_style", "Food Truck");
    }
    if (field === "permits_required" && option === "Alcohol" && !current.includes(option)) {
      onChange("alcohol_required", true);
    }
    onChange(field, next);
  };

  const renderCheckboxGroup = (
    title: string,
    draft: EventDraft,
    onChange: (field: keyof EventDraft, value: string | boolean | string[] | null) => void,
    field: keyof EventDraft,
    options: string[],
  ) => (
    <div className="space-y-2">
      <div className="text-sm font-medium">{title}</div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {options.map((option) => {
          const checked = normalizeArray(draft[field] as string[] | string).includes(option);
          return (
            <label
              key={option}
              className="flex min-h-10 items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleDraftArray(draft, onChange, field, option)}
              />
              {option}
            </label>
          );
        })}
      </div>
    </div>
  );

  const renderYesNo = (
    label: string,
    value: boolean | null,
    onChange: (value: boolean | null) => void,
  ) => (
    <label className="text-sm">
      {label}
      <select
        className="mt-1 h-10 w-full rounded-md border bg-white px-3"
        value={value === true ? "YES" : value === false ? "NO" : ""}
        onChange={(e) =>
          onChange(e.target.value === "YES" ? true : e.target.value === "NO" ? false : null)
        }
      >
        <option value="">Select</option>
        <option value="YES">Yes</option>
        <option value="NO">No</option>
      </select>
    </label>
  );

  const renderEventForm = (
    draft: EventDraft,
    onChange: (field: keyof EventDraft, value: string | boolean | string[] | null) => void,
  ) => (
    <div className="space-y-3">
      <details open className="rounded-md border bg-white p-4">
        <summary className="cursor-pointer text-base font-semibold">Basics</summary>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm xl:col-span-2">
            Event Name *
            <input
              className="mt-1 h-10 w-full rounded-md border bg-white px-3"
              value={draft.event_name}
              onChange={(e) => onChange("event_name", e.target.value)}
            />
          </label>
          <label className="text-sm">
            Event Type *
            <select
              className="mt-1 h-10 w-full rounded-md border bg-white px-3"
              value={draft.event_type}
              onChange={(e) => onChange("event_type", e.target.value)}
            >
              <option value="">Select</option>
              {eventTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Event Visibility *
            <select
              className="mt-1 h-10 w-full rounded-md border bg-white px-3"
              value={draft.event_visibility}
              onChange={(e) => onChange("event_visibility", e.target.value)}
            >
              <option value="PRIVATE">Private</option>
              <option value="PUBLIC">Public</option>
            </select>
          </label>
          {draft.event_type === "Other" ? (
            <label className="text-sm xl:col-span-2">
              Other Event Type *
              <input
                className="mt-1 h-10 w-full rounded-md border bg-white px-3"
                value={draft.event_type_other}
                onChange={(e) => onChange("event_type_other", e.target.value)}
              />
            </label>
          ) : null}
          <label className="text-sm">
            Event Tone
            <select
              className="mt-1 h-10 w-full rounded-md border bg-white px-3"
              value={draft.event_style}
              onChange={(e) => onChange("event_style", e.target.value)}
            >
              <option value="">Select</option>
              {eventStyleOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm xl:col-span-4">
            Description
            <textarea
              className="mt-1 min-h-[110px] w-full rounded-md border bg-white px-3 py-2"
              value={draft.event_description}
              onChange={(e) => onChange("event_description", e.target.value)}
            />
          </label>
        </div>
      </details>

      <details open className="rounded-md border bg-white p-4">
        <summary className="cursor-pointer text-base font-semibold">Timing & Location</summary>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm">
            Event Date *
            <input
              type="date"
              className="mt-1 h-10 w-full rounded-md border bg-white px-3"
              value={draft.event_date}
              onChange={(e) => onChange("event_date", e.target.value)}
            />
          </label>
          <label className="text-sm">
            Event Time *
            <input
              type="time"
              className="mt-1 h-10 w-full rounded-md border bg-white px-3"
              value={draft.event_time}
              onChange={(e) => onChange("event_time", e.target.value)}
            />
          </label>
          <label className="text-sm">
            Duration Minutes *
            <input
              type="number"
              min="1"
              className="mt-1 h-10 w-full rounded-md border bg-white px-3"
              value={draft.event_duration_minutes}
              onChange={(e) => onChange("event_duration_minutes", e.target.value)}
            />
          </label>
          <label className="text-sm">
            Close Date *
            <input
              type="date"
              className="mt-1 h-10 w-full rounded-md border bg-white px-3"
              value={draft.event_close_date}
              onChange={(e) => onChange("event_close_date", e.target.value)}
            />
          </label>
          <label className="text-sm">
            Close Time *
            <input
              type="time"
              className="mt-1 h-10 w-full rounded-md border bg-white px-3"
              value={draft.event_close_time}
              onChange={(e) => onChange("event_close_time", e.target.value)}
            />
          </label>
          <label className="text-sm xl:col-span-2">
            Address *
            <input
              className="mt-1 h-10 w-full rounded-md border bg-white px-3"
              value={draft.event_address}
              onChange={(e) => {
                onChange("event_address", e.target.value);
                onChange("formatted_address", e.target.value);
              }}
            />
          </label>
          <label className="text-sm">
            City *
            <input
              className="mt-1 h-10 w-full rounded-md border bg-white px-3"
              value={draft.event_city}
              onChange={(e) => onChange("event_city", e.target.value)}
            />
          </label>
          <label className="text-sm">
            State *
            <input
              className="mt-1 h-10 w-full rounded-md border bg-white px-3"
              value={draft.event_state}
              onChange={(e) => onChange("event_state", e.target.value)}
            />
          </label>
          <label className="text-sm">
            Zip
            <input
              className="mt-1 h-10 w-full rounded-md border bg-white px-3"
              value={draft.event_zip}
              onChange={(e) => onChange("event_zip", e.target.value)}
            />
          </label>
          <label className="text-sm">
            Latitude
            <input
              type="number"
              step="any"
              className="mt-1 h-10 w-full rounded-md border bg-white px-3"
              value={draft.latitude}
              onChange={(e) => onChange("latitude", e.target.value)}
            />
          </label>
          <label className="text-sm">
            Longitude
            <input
              type="number"
              step="any"
              className="mt-1 h-10 w-full rounded-md border bg-white px-3"
              value={draft.longitude}
              onChange={(e) => onChange("longitude", e.target.value)}
            />
          </label>
        </div>
      </details>

      <details open className="rounded-md border bg-white p-4">
        <summary className="cursor-pointer text-base font-semibold">Services & Requirements</summary>
        <div className="mt-4 space-y-4">
          {renderCheckboxGroup("Service Type *", draft, onChange, "service_types", serviceTypeOptions)}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="text-sm">
              Primary Service Style *
              <select
                className="mt-1 h-10 w-full rounded-md border bg-white px-3"
                value={draft.primary_service_style}
                onChange={(e) => onChange("primary_service_style", e.target.value)}
                disabled={draft.service_types.includes("Food Truck")}
              >
                <option value="">Select</option>
                {primaryServiceStyleOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={draft.insurance_required}
                onChange={(e) => onChange("insurance_required", e.target.checked)}
              />
              Certificate of Insurance required
            </label>
            <label className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={draft.alcohol_required}
                onChange={(e) => {
                  onChange("alcohol_required", e.target.checked);
                  if (e.target.checked && !draft.permits_required.includes("Alcohol")) {
                    onChange("permits_required", [...draft.permits_required, "Alcohol"]);
                  }
                }}
              />
              Alcohol service required
            </label>
          </div>
          {renderCheckboxGroup("Permits Required", draft, onChange, "permits_required", permitOptions)}
          {renderCheckboxGroup("Power Required", draft, onChange, "power_required", powerOptions)}
          {renderCheckboxGroup("Cuisine Preferences", draft, onChange, "cuisine_preferences", cuisineOptions)}
          {renderCheckboxGroup("Dietary Restrictions", draft, onChange, "dietary_restrictions", dietaryOptions)}
          {renderCheckboxGroup("Equipment Needed", draft, onChange, "equipment_needed", equipmentOptions)}
        </div>
      </details>

      <details open className="rounded-md border bg-white p-4">
        <summary className="cursor-pointer text-base font-semibold">Food, VIP & Budget</summary>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm">
            Number of Guests *
            <input
              type="number"
              min="1"
              className="mt-1 h-10 w-full rounded-md border bg-white px-3"
              value={draft.number_of_guests}
              onChange={(e) => onChange("number_of_guests", e.target.value)}
            />
          </label>
          <label className="text-sm">
            Vendors Needed *
            <input
              type="number"
              min="1"
              className="mt-1 h-10 w-full rounded-md border bg-white px-3"
              value={draft.number_of_vendors_needed}
              onChange={(e) => onChange("number_of_vendors_needed", e.target.value)}
            />
          </label>
          {renderYesNo("Will free food be offered? *", draft.free_food_offered, (value) => {
            onChange("free_food_offered", value);
            if (value !== true) {
              onChange("free_food_provider", "");
              onChange("vendors_required_to_giveaway_food", null);
            }
          })}
          {draft.free_food_offered ? (
            <>
              <label className="text-sm">
                Free Food Company/Vendor *
                <input
                  className="mt-1 h-10 w-full rounded-md border bg-white px-3"
                  value={draft.free_food_provider}
                  onChange={(e) => onChange("free_food_provider", e.target.value)}
                />
              </label>
              {renderYesNo(
                "Are vendors required to give away food? *",
                draft.vendors_required_to_giveaway_food,
                (value) => onChange("vendors_required_to_giveaway_food", value),
              )}
            </>
          ) : null}
          <label className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={draft.catered_vip_section_enabled}
              onChange={(e) => onChange("catered_vip_section_enabled", e.target.checked)}
            />
            Catered VIP section paid by coordinator
          </label>
          {draft.catered_vip_section_enabled ? (
            <label className="text-sm">
              # of VIP Guests *
              <input
                type="number"
                min="1"
                className="mt-1 h-10 w-full rounded-md border bg-white px-3"
                value={draft.vip_guest_count}
                onChange={(e) => onChange("vip_guest_count", e.target.value)}
              />
            </label>
          ) : null}
          <label className="text-sm">
            Who is paying? *
            <select
              className="mt-1 h-10 w-full rounded-md border bg-white px-3"
              value={draft.payment_responsibility}
              onChange={(e) => onChange("payment_responsibility", e.target.value)}
            >
              <option value="NONE">None</option>
              <option value="COORDINATOR">Event Coordinator pays vendor</option>
              <option value="VENDOR">Vendor pays to attend</option>
              <option value="BOTH">Both</option>
            </select>
          </label>
          <label className="text-sm">
            Vendor Fee
            <input
              type="number"
              min="0"
              className="mt-1 h-10 w-full rounded-md border bg-white px-3"
              value={draft.vendor_fee}
              onChange={(e) => onChange("vendor_fee", e.target.value)}
            />
          </label>
          <label className="text-sm">
            Budget Amount
            <input
              type="number"
              min="0"
              className="mt-1 h-10 w-full rounded-md border bg-white px-3"
              value={draft.budgeted_amount}
              onChange={(e) => onChange("budgeted_amount", e.target.value)}
            />
          </label>
        </div>
      </details>

      <details open className="rounded-md border bg-white p-4">
        <summary className="cursor-pointer text-base font-semibold">Tickets & Status</summary>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm">
            Status
            <select
              className="mt-1 h-10 w-full rounded-md border bg-white px-3"
              value={draft.status}
              onChange={(e) => onChange("status", e.target.value)}
            >
              {eventStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={draft.ticket_sales_enabled}
              onChange={(e) => onChange("ticket_sales_enabled", e.target.checked)}
            />
            Ticket sales enabled
          </label>
          <label className="text-sm md:col-span-2">
            Ticket URL
            <input
              className="mt-1 h-10 w-full rounded-md border bg-white px-3"
              value={draft.ticket_url}
              onChange={(e) => onChange("ticket_url", e.target.value)}
            />
          </label>
        </div>
      </details>
    </div>
  );

  const eventColumns: Column<MarketplaceRepositoryEvent>[] = [
    {
      header: "Event",
      fieldName: "event_name",
      accessor: (event) => (
        <div className="min-w-[280px] space-y-2">
          <div className="font-medium">{event.event_name || "-"}</div>
          <div className="text-xs text-muted-foreground">
            {event.event_description || "No description"}
          </div>
          <div className="text-xs">
            {[event.event_type, event.primary_service_style].filter(Boolean).join(" / ") ||
              "Event details not set"}
          </div>
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
        event.ticket_url ? (
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
          <div className="mb-4 rounded-lg border bg-slate-50 p-4">
            <div className="mb-4 max-w-2xl">
              <label className="text-sm font-medium">
                Coordinator *
                <select
                  className="mt-1 h-10 w-full rounded-md border bg-white px-3"
                  value={newEvent.customer_user_id}
                  onChange={(e) => updateNewEvent("customer_user_id", e.target.value)}
                >
                  <option value="">Select coordinator</option>
                  {coordinators.map((coordinator: any) => (
                    <option key={coordinator._id} value={coordinator._id}>
                      {getPersonName(coordinator)} - {coordinator.email}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {renderEventForm(newEvent, (field, value) => updateNewEvent(field, value))}
            <div className="mt-4 flex justify-end">
              <Button
                onClick={createEvent}
                disabled={updatingId === "create-event"}
              >
                <Save className="mr-1 h-4 w-4" /> Save Event
              </Button>
            </div>
          </div>
        ) : null}

        {editingEventId && eventDrafts[editingEventId] ? (
          <div className="mb-4 rounded-lg border bg-orange-50 p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">Edit Marketplace Event</h3>
                <p className="text-sm text-muted-foreground">
                  All required and optional coordinator event fields are available here.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    const event = events.find((item) => item.event_id === editingEventId);
                    if (event) saveEvent(event);
                  }}
                  disabled={updatingId === editingEventId}
                >
                  <Save className="mr-1 h-4 w-4" /> Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingEventId(null);
                    setEventDrafts((prev) => {
                      const next = { ...prev };
                      delete next[editingEventId];
                      return next;
                    });
                  }}
                >
                  <X className="mr-1 h-4 w-4" /> Cancel
                </Button>
              </div>
            </div>
            {renderEventForm(eventDrafts[editingEventId], (field, value) =>
              updateEventDraft(editingEventId, field, value),
            )}
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

    </div>
  );
}
