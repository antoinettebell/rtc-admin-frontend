"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import {
  Ban,
  ChevronDown,
  ExternalLink,
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
  MarketplacePaymentResponsibility,
  MarketplaceRepositoryEvent,
  MarketplaceSubmissionType,
  marketplaceApiService,
} from "@/services/marketplace-api-service";
import { userApiService } from "@/services/user-api-service";
import {
  getDerivedPaymentResponsibility,
  getMarketplacePaymentVisibility,
} from "@/helpers/marketplace-payment-responsibility";
import {
  formatMarketplaceCalendarDate,
  normalizeMarketplaceCalendarDateInput,
  normalizeMarketplaceZonedDateInput,
} from "@/helpers/marketplace-event-date";

const getPersonName = (user: any) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
  user?.email ||
  "-";

const eventFormSectionClass =
  "group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow open:shadow-md";

const EventFormSectionSummary = ({ children }: { children: React.ReactNode }) => (
  <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-base font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
    <span>{children}</span>
    <ChevronDown className="h-5 w-5 text-slate-500 transition-transform group-open:rotate-180" />
  </summary>
);

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
const platedOptions = [
  "Individual Plated Meals",
  "Buffet Style",
  "Boxed Meals",
  "Family Style / Shared Platters",
  "Passed Appetizers",
  "Food Truck Window Service",
  "Drop-Off Catering Only",
  "Full-Service Catering",
  "Dessert / Snack Service",
  "Custom Menu / Chef's Choice",
];
const platedCourseOptions = [
  "1 Course",
  "2 Courses",
  "3 Courses",
  "4 Courses",
  "5 Courses",
  "Vendor Recommended",
];
const entreeSelectionOptions = [
  "Single entree for all guests",
  "Guest choice of 2-3 entrees",
  "Table-side choice",
  "Vendor recommended",
];
const platedIncludedItemOptions = [
  "Bread",
  "Salad",
  "Dessert",
  "None",
  "Vendor recommended",
];
const buffetSetupOptions = [
  "Full menu buffet",
  "Self-service buffet",
  "Staff-served buffet",
  "Buffet stations",
];
const cateringIncludedItemOptions = [
  "Bread",
  "Salad",
  "Dessert",
  "Drinks",
  "Plates/utensils/napkins",
  "Vendor recommended",
];
const foodTruckMenuOptions = ["Full Menu", "Limited event menu", "Vendor recommended"];
const stationSetupOptions = [
  "Served stations",
  "Self-service stations",
  "Family-style table service",
  "Vendor recommended",
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
  charitable_event: boolean;
  religious_organization: boolean;
  event_date: string;
  event_time: string;
  event_timezone: string;
  event_duration_minutes: string;
  event_address: string;
  event_city: string;
  event_state: string;
  event_zip: string;
  latitude: string;
  longitude: string;
  formatted_address: string;
  geocoded_address: string;
  place_id: string;
  geocoding_provider: string;
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
  vip_section_enabled: boolean;
  vip_section_details: string;
  fully_catered_event: boolean;
  ga_food_sales_allowed: boolean | null;
  waive_vendor_fee_for_combined_award: boolean | null;
  vendor_fee_payment_deadline: string;
  separate_vip_vendor_required: boolean;
  vip_guest_count: string;
  ga_ticket_quantity: string;
  ga_ticket_price: string;
  vip_ticket_quantity: string;
  vip_ticket_price: string;
  event_vendor_needs: Array<{ vendor_type: "MERCHANDISE" | "SERVICE" | "OTHER"; type_description?: string | null; quantity: number; fee: number }>;
  event_vendor_electricity_fee: string;
  cuisine_preferences: string[];
  dietary_restrictions: string[];
  equipment_needed: string[];
  plated_number_of_courses: string;
  plated_options: string[];
  plated_entree_selection: string;
  plated_included_items: string[];
  buffet_setup: string;
  buffet_included_items: string[];
  food_truck_options: string;
  station_setup_type: string;
  station_included_items: string[];
  service_notes: string;
  payment_responsibility: "COORDINATOR" | "VENDOR" | "BOTH" | "NONE";
  vendor_fee: string;
  budgeted_amount: string;
  event_close_date: string;
  event_close_time: string;
  status: string;
  ticket_sales_enabled: boolean;
  ticket_url: string;
  admin_reason: string;
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
  charitable_event: false,
  religious_organization: false,
  event_date: "",
  event_time: "",
  event_timezone: "America/New_York",
  event_duration_minutes: "",
  event_address: "",
  event_city: "",
  event_state: "",
  event_zip: "",
  latitude: "",
  longitude: "",
  formatted_address: "",
  geocoded_address: "",
  place_id: "",
  geocoding_provider: "",
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
  vip_section_enabled: false,
  vip_section_details: "",
  fully_catered_event: false,
  ga_food_sales_allowed: null,
  waive_vendor_fee_for_combined_award: null,
  vendor_fee_payment_deadline: "",
  separate_vip_vendor_required: false,
  vip_guest_count: "",
  ga_ticket_quantity: "0",
  ga_ticket_price: "0",
  vip_ticket_quantity: "0",
  vip_ticket_price: "0",
  event_vendor_needs: [],
  event_vendor_electricity_fee: "0",
  cuisine_preferences: [],
  dietary_restrictions: [],
  equipment_needed: [],
  plated_number_of_courses: "",
  plated_options: [],
  plated_entree_selection: "",
  plated_included_items: [],
  buffet_setup: "",
  buffet_included_items: [],
  food_truck_options: "",
  station_setup_type: "",
  station_included_items: [],
  service_notes: "",
  payment_responsibility: "NONE",
  vendor_fee: "0",
  budgeted_amount: "0",
  event_close_date: "",
  event_close_time: "",
  status: "DRAFT",
  ticket_sales_enabled: false,
  ticket_url: "",
  admin_reason: "",
};

const emptyNewEventDraft: NewEventDraft = {
  ...emptyEventDraft,
  customer_user_id: "",
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

const submissionTypeLabel = (type: MarketplaceSubmissionType) => {
  if (type === "FOOD_BID") return "Food Bid";
  if (type === "FOOD_APPLICATION") return "Food Application";
  return "Marketplace Vendor Application";
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
  charitable_event: !!event.charitable_event,
  religious_organization: !!event.religious_organization,
  event_date: normalizeMarketplaceCalendarDateInput(event.event_date),
  event_time: normalizeTimeInput(event.event_time),
  event_timezone: event.event_timezone || "America/New_York",
  event_duration_minutes: event.event_duration_minutes != null ? String(event.event_duration_minutes) : "",
  event_address: event.event_address || "",
  event_city: event.event_city || "",
  event_state: event.event_state || "",
  event_zip: event.event_zip || "",
  latitude: event.latitude != null ? String(event.latitude) : "",
  longitude: event.longitude != null ? String(event.longitude) : "",
  formatted_address: event.formatted_address || "",
  geocoded_address: event.geocoded_address || "",
  place_id: event.place_id || "",
  geocoding_provider: event.geocoding_provider || "",
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
  vip_section_enabled: !!event.vip_section_enabled,
  vip_section_details: event.vip_section_details || "",
  fully_catered_event: !!event.fully_catered_event,
  ga_food_sales_allowed: event.ga_food_sales_allowed === true ? true : event.ga_food_sales_allowed === false ? false : null,
  waive_vendor_fee_for_combined_award: event.waive_vendor_fee_for_combined_award === true ? true : event.waive_vendor_fee_for_combined_award === false ? false : null,
  vendor_fee_payment_deadline: normalizeMarketplaceCalendarDateInput(
    event.vendor_fee_payment_deadline,
  ),
  separate_vip_vendor_required: !!event.separate_vip_vendor_required,
  vip_guest_count: event.vip_guest_count != null ? String(event.vip_guest_count) : "",
  ga_ticket_quantity: event.ga_ticket_quantity != null ? String(event.ga_ticket_quantity) : "0",
  ga_ticket_price: event.ga_ticket_price != null ? String(event.ga_ticket_price) : "0",
  vip_ticket_quantity: event.vip_ticket_quantity != null ? String(event.vip_ticket_quantity) : "0",
  vip_ticket_price: event.vip_ticket_price != null ? String(event.vip_ticket_price) : "0",
  event_vendor_needs: event.event_vendor_needs || [],
  event_vendor_electricity_fee: event.event_vendor_electricity_fee != null ? String(event.event_vendor_electricity_fee) : "0",
  cuisine_preferences: normalizeArray(event.cuisine_preferences),
  dietary_restrictions: normalizeArray(event.dietary_restrictions),
  equipment_needed: normalizeArray(event.equipment_needed),
  plated_number_of_courses:
    event.plated_number_of_courses != null ? String(event.plated_number_of_courses) : "",
  plated_options: normalizeArray(event.plated_options),
  plated_entree_selection: event.plated_entree_selection || "",
  plated_included_items: normalizeArray(event.plated_included_items),
  buffet_setup: event.buffet_setup || "",
  buffet_included_items: normalizeArray(event.buffet_included_items),
  food_truck_options: normalizeArray(event.food_truck_options)[0] || "",
  station_setup_type: event.station_setup_type || "",
  station_included_items: normalizeArray(event.station_included_items),
  service_notes: event.service_notes || "",
  payment_responsibility: event.payment_responsibility || "NONE",
  vendor_fee: event.vendor_fee != null ? String(event.vendor_fee) : "0",
  budgeted_amount: event.budgeted_amount != null ? String(event.budgeted_amount) : "0",
  event_close_date: normalizeMarketplaceZonedDateInput(
    event.event_close_date,
    event.event_timezone || "America/New_York",
  ),
  event_close_time: normalizeTimeInput(event.event_close_time),
  status: event.status || "DRAFT",
  ticket_sales_enabled: !!event.ticket_sales_enabled,
  ticket_url: event.ticket_url || "",
  admin_reason: "",
});

const buildEventPayload = (draft: EventDraft): MarketplaceEventPayload => {
  const serviceTypes = normalizeArray(draft.service_types);
  const permits = normalizeArray(draft.permits_required).filter((permit) => permit !== "None");
  const foodTruckSelected = serviceTypes.includes("Food Truck");
  const primaryServiceStyle = foodTruckSelected
    ? "Food Truck"
    : draft.primary_service_style || null;
  const paymentResponsibility = getDerivedPaymentResponsibility(draft);

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
    charitable_event: draft.charitable_event,
    religious_organization: draft.religious_organization,
    event_date: draft.event_date || null,
    event_time: draft.event_time || null,
    event_timezone: draft.event_timezone || "America/New_York",
    event_duration_hours: 0,
    event_duration_minutes: numberOrNull(draft.event_duration_minutes),
    event_address: draft.event_address,
    event_city: draft.event_city,
    event_state: draft.event_state,
    event_zip: draft.event_zip,
    latitude: numberOrNull(draft.latitude),
    longitude: numberOrNull(draft.longitude),
    formatted_address: draft.formatted_address || draft.event_address,
    geocoded_address: draft.geocoded_address || draft.formatted_address || draft.event_address,
    place_id: draft.place_id || null,
    geocoding_provider: draft.geocoding_provider || null,
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
    vip_section_enabled: draft.vip_section_enabled,
    vip_section_details: draft.vip_section_enabled ? draft.vip_section_details : null,
    fully_catered_event: draft.fully_catered_event,
    ga_food_sales_allowed: draft.ga_food_sales_allowed,
    waive_vendor_fee_for_combined_award: draft.waive_vendor_fee_for_combined_award,
    vendor_fee_payment_deadline: draft.vendor_fee_payment_deadline || null,
    separate_vip_vendor_required: draft.separate_vip_vendor_required,
    vip_guest_count: draft.vip_section_enabled
      ? numberOrNull(draft.vip_guest_count)
      : 0,
    ga_ticket_quantity: numberOrNull(draft.ga_ticket_quantity) || 0,
    ga_ticket_price: moneyOrZero(draft.ga_ticket_price),
    vip_ticket_quantity: draft.vip_section_enabled ? numberOrNull(draft.vip_ticket_quantity) || 0 : 0,
    vip_ticket_price: draft.vip_section_enabled ? moneyOrZero(draft.vip_ticket_price) : 0,
    event_vendor_needs: draft.event_vendor_needs,
    event_vendor_electricity_fee: moneyOrZero(draft.event_vendor_electricity_fee),
    cuisine_preferences: normalizeArray(draft.cuisine_preferences),
    dietary_restrictions: normalizeArray(draft.dietary_restrictions),
    equipment_needed: normalizeArray(draft.equipment_needed),
    plated_number_of_courses: draft.plated_number_of_courses || null,
    plated_options: normalizeArray(draft.plated_options),
    plated_entree_selection: draft.plated_entree_selection || null,
    plated_included_items: normalizeArray(draft.plated_included_items),
    buffet_setup: draft.buffet_setup || null,
    buffet_included_items: normalizeArray(draft.buffet_included_items),
    food_truck_options: draft.food_truck_options ? [draft.food_truck_options] : [],
    station_setup_type: draft.station_setup_type || null,
    station_included_items: normalizeArray(draft.station_included_items),
    service_notes: draft.service_notes || null,
    payment_responsibility: paymentResponsibility,
    vendor_fee: moneyOrZero(draft.vendor_fee),
    budgeted_amount: moneyOrZero(draft.budgeted_amount),
    event_close_date: draft.event_close_date || null,
    event_close_time: draft.event_close_time || null,
    status: draft.status,
    ticket_sales_enabled: draft.ticket_sales_enabled,
    ticket_url: draft.ticket_sales_enabled ? draft.ticket_url : "",
    admin_reason: draft.admin_reason.trim(),
  };
};

export default function MarketplaceRepositoryPage() {
  const [eventPagination, setEventPagination] = useState({ page: 1, limit: 10 });
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [eventStatus, setEventStatus] = useState("");
  const [eventSearch, setEventSearch] = useState("");
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventDrafts, setEventDrafts] = useState<Record<string, EventDraft>>({});
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

  const { data: newEventDraftResult } = useQuery({
    queryKey: ["marketplace-repository-new-event-draft"],
    queryFn: () => marketplaceApiService.getRepositoryNewEventDraft(),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const events = eventResult?.data?.data?.records || [];
  const eventTotal = eventResult?.data?.data?.total || 0;
  const coordinators = coordinatorResult?.data?.data?.records || [];

  React.useEffect(() => {
    const adminDraft = newEventDraftResult?.data?.data?.adminDraft;
    if (!adminDraft?.payload) return;
    const payload = adminDraft.payload;
    setNewEvent({
      ...emptyNewEventDraft,
      ...toEventDraft(payload as MarketplaceRepositoryEvent),
      customer_user_id: String(payload.customer_user_id || ""),
      admin_reason: adminDraft.reason || "",
    });
    setCreatingEvent(true);
  }, [newEventDraftResult]);

  const startEditEvent = (event: MarketplaceRepositoryEvent) => {
    const savedDraft = event.admin_draft?.payload || {};
    setEditingEventId(event.event_id);
    setEventDrafts((prev) => ({
      ...prev,
      [event.event_id]: {
        ...toEventDraft({ ...event, ...savedDraft }),
        admin_reason: event.admin_draft?.reason || "",
      },
    }));
  };

  const updateEventDraft = (
    eventId: string,
    field: keyof EventDraft,
    value: EventDraft[keyof EventDraft],
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
    value: NewEventDraft[keyof NewEventDraft],
  ) => {
    setNewEvent((prev) => ({ ...prev, [field]: value }));
  };

  const saveEvent = async (
    event: MarketplaceRepositoryEvent,
    saveMode: "DRAFT" | "PUBLISH",
  ) => {
    const draft = eventDrafts[event.event_id];
    if (!draft) return;
    if (!draft.admin_reason.trim()) {
      toast.error("Enter an admin reason for this event change.");
      return;
    }
    setUpdatingId(event.event_id);
    try {
      await marketplaceApiService.updateRepositoryEvent(
        event.event_id,
        { ...buildEventPayload(draft), save_mode: saveMode },
      );
      toast.success(saveMode === "DRAFT" ? "Event draft saved" : "Marketplace event published");
      if (saveMode === "PUBLISH") setEditingEventId(null);
      await refetchEvents();
    } catch (error: any) {
      const validationErrors = error?.response?.data?.validation_errors || error?.response?.data?.data?.validation_errors;
      const message = Array.isArray(validationErrors) && validationErrors.length
        ? validationErrors.map((item: any) => `${item.field}: ${item.message}`).join(" · ")
        : error?.response?.data?.message || "Unable to update event";
      toast.error(message);
    } finally {
      setUpdatingId(null);
    }
  };

  const createEvent = async (saveMode: "DRAFT" | "PUBLISH") => {
    if (!newEvent.admin_reason.trim()) {
      toast.error("Provide an admin reason before saving this event draft.");
      return;
    }
    if (
      saveMode === "PUBLISH" &&
      (!newEvent.customer_user_id || !newEvent.event_name.trim())
    ) {
      toast.error("Select a coordinator and enter an event name before publishing.");
      return;
    }
    setUpdatingId("create-event");
    try {
      await marketplaceApiService.createRepositoryEvent({
        ...buildEventPayload(newEvent),
        ...(newEvent.customer_user_id
          ? { customer_user_id: newEvent.customer_user_id }
          : {}),
        save_mode: saveMode,
      });
      toast.success(saveMode === "DRAFT" ? "Event draft saved" : "Marketplace event created");
      if (saveMode === "PUBLISH") {
        setNewEvent(emptyNewEventDraft);
        setCreatingEvent(false);
        await refetchEvents();
      }
    } catch (error: any) {
      const validationErrors = error?.response?.data?.validation_errors || error?.response?.data?.data?.validation_errors;
      const message = Array.isArray(validationErrors) && validationErrors.length
        ? validationErrors.map((item: any) => `${item.field}: ${item.message}`).join(" · ")
        : error?.response?.data?.message || "Unable to save event";
      toast.error(message);
    } finally {
      setUpdatingId(null);
    }
  };

  const updateEventStatus = async (
    event: MarketplaceRepositoryEvent,
    status: string,
  ) => {
    const reason = window.prompt(`Reason for changing this event to ${status}?`);
    if (!reason?.trim()) return;
    setUpdatingId(`${event.event_id}-${status}`);
    try {
      await marketplaceApiService.updateRepositoryEvent(event.event_id, {
        status,
        admin_reason: reason.trim(),
      });
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
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to remove image");
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleDraftArray = (
    draft: EventDraft,
    onChange: (field: keyof EventDraft, value: EventDraft[keyof EventDraft]) => void,
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
    onChange: (field: keyof EventDraft, value: EventDraft[keyof EventDraft]) => void,
  ) => {
    const derivedPaymentResponsibility = getDerivedPaymentResponsibility(draft);
    const paymentVisibility = getMarketplacePaymentVisibility(draft);
    return (
    <div className="space-y-3">
      <details open className={eventFormSectionClass}>
        <EventFormSectionSummary>Basics</EventFormSectionSummary>
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

      <details open className={eventFormSectionClass}>
        <EventFormSectionSummary>Timing & Location</EventFormSectionSummary>
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
          <label className="text-sm">
            Event Timezone *
            <input
              className="mt-1 h-10 w-full rounded-md border bg-white px-3"
              value={draft.event_timezone}
              onChange={(e) => onChange("event_timezone", e.target.value)}
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
          <label className="text-sm xl:col-span-2">
            Formatted Address
            <input className="mt-1 h-10 w-full rounded-md border bg-white px-3" value={draft.formatted_address} onChange={(e) => onChange("formatted_address", e.target.value)} />
          </label>
          <label className="text-sm xl:col-span-2">
            Geocoded Address
            <input className="mt-1 h-10 w-full rounded-md border bg-white px-3" value={draft.geocoded_address} onChange={(e) => onChange("geocoded_address", e.target.value)} />
          </label>
          <label className="text-sm xl:col-span-2">Google Place ID<input className="mt-1 h-10 w-full rounded-md border bg-white px-3" value={draft.place_id} onChange={(e) => onChange("place_id", e.target.value)} /></label>
          <label className="text-sm xl:col-span-2">Geocoding Provider<input className="mt-1 h-10 w-full rounded-md border bg-white px-3" value={draft.geocoding_provider} onChange={(e) => onChange("geocoding_provider", e.target.value)} /></label>
        </div>
      </details>

      <details open className={eventFormSectionClass}>
        <EventFormSectionSummary>Services & Requirements</EventFormSectionSummary>
        <div className="mt-4 space-y-4">
          {renderCheckboxGroup("Service Type *", draft, onChange, "service_types", serviceTypeOptions)}
          {renderCheckboxGroup("Service Styles", draft, onChange, "service_styles", primaryServiceStyleOptions)}
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
            <label className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm"><input type="checkbox" checked={draft.charitable_event} onChange={(e) => onChange("charitable_event", e.target.checked)} />Charitable event</label>
            <label className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm"><input type="checkbox" checked={draft.religious_organization} onChange={(e) => onChange("religious_organization", e.target.checked)} />Religious organization</label>
          </div>
          {renderCheckboxGroup("Permits Required", draft, onChange, "permits_required", permitOptions)}
          {renderCheckboxGroup("Power Required", draft, onChange, "power_required", powerOptions)}
          {renderCheckboxGroup("Cuisine Preferences", draft, onChange, "cuisine_preferences", cuisineOptions)}
          {renderCheckboxGroup("Dietary Restrictions", draft, onChange, "dietary_restrictions", dietaryOptions)}
          {renderCheckboxGroup("Equipment Needed", draft, onChange, "equipment_needed", equipmentOptions)}
        </div>
      </details>

      <details open className={eventFormSectionClass}>
        <EventFormSectionSummary>Food, VIP & Budget</EventFormSectionSummary>
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
          {renderYesNo("Is any food being given away for free by the event organizers or sponsors, aside from what people buy or get from the hired caterers and trucks? *", draft.free_food_offered, (value) => {
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
              checked={draft.vip_section_enabled}
              onChange={(e) => onChange("vip_section_enabled", e.target.checked)}
            />
            VIP section enabled
          </label>
          {draft.vip_section_enabled ? (
            <>
              <label className="text-sm">
                Expected VIP Guests *
                <input type="number" min="0" className="mt-1 h-10 w-full rounded-md border bg-white px-3" value={draft.vip_guest_count} onChange={(e) => onChange("vip_guest_count", e.target.value)} />
              </label>
              <label className="text-sm md:col-span-2">
                VIP Section Details
                <input className="mt-1 h-10 w-full rounded-md border bg-white px-3" value={draft.vip_section_details} onChange={(e) => onChange("vip_section_details", e.target.value)} />
              </label>
              <label className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm">
                <input type="checkbox" checked={draft.catered_vip_section_enabled} onChange={(e) => onChange("catered_vip_section_enabled", e.target.checked)} />
                VIP catering paid by coordinator
              </label>
            </>
          ) : null}
          <label className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm">
            <input type="checkbox" checked={draft.fully_catered_event} onChange={(e) => onChange("fully_catered_event", e.target.checked)} />
            Fully catered event
          </label>
          {draft.catered_vip_section_enabled ? (
            <>
              {renderYesNo("Vendors may sell food to GA guests", draft.ga_food_sales_allowed, (value) => onChange("ga_food_sales_allowed", value))}
              {draft.ga_food_sales_allowed ? renderYesNo("Waive fee for combined award", draft.waive_vendor_fee_for_combined_award, (value) => onChange("waive_vendor_fee_for_combined_award", value)) : null}
              <label className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm">
                <input type="checkbox" checked={draft.separate_vip_vendor_required} onChange={(e) => onChange("separate_vip_vendor_required", e.target.checked)} />
                Additional VIP catering service slot
              </label>
              <p className="mt-1 text-xs text-gray-500">
                This adds a VIP catering requirement to the event. A qualified vendor may still offer both VIP Catering and GA Sales.
              </p>
            </>
          ) : null}
          {paymentVisibility.showPaymentDeadline ? (
            <label className="text-sm">
              Last Date to Accept Payments
              <input
                type="date"
                className="mt-1 h-10 w-full rounded-md border bg-white px-3"
                value={draft.vendor_fee_payment_deadline}
                onChange={(e) => onChange("vendor_fee_payment_deadline", e.target.value)}
              />
            </label>
          ) : null}
          <label className="text-sm">
            Who is paying? *
            <select
              disabled
              className="mt-1 h-10 w-full rounded-md border bg-white px-3"
              value={derivedPaymentResponsibility}
              onChange={(e) => onChange("payment_responsibility", e.target.value)}
            >
              <option value="NONE">None</option>
              <option value="COORDINATOR">Event Coordinator pays vendor</option>
              <option value="VENDOR">Vendor pays to attend</option>
              <option value="BOTH">Both</option>
            </select>
          </label>
          {paymentVisibility.showVendorFee ? <label className="text-sm">
            Vendor Fee
            <input
              type="number"
              min="0"
              className="mt-1 h-10 w-full rounded-md border bg-white px-3"
              value={draft.vendor_fee}
              onChange={(e) => onChange("vendor_fee", e.target.value)}
            />
          </label> : null}
          {paymentVisibility.showBudget ? <label className="text-sm">
            Budget Amount
            <input
              type="number"
              min="0"
              className="mt-1 h-10 w-full rounded-md border bg-white px-3"
              value={draft.budgeted_amount}
              onChange={(e) => onChange("budgeted_amount", e.target.value)}
            />
          </label> : null}
        </div>
      </details>

      <details className={eventFormSectionClass}>
        <EventFormSectionSummary>Marketplace Vendor Needs</EventFormSectionSummary>
        <div className="mt-4 space-y-3">
          {draft.event_vendor_needs.map((need, index) => (
            <div key={`${need.vendor_type}-${index}`} className="grid gap-2 rounded-md border p-3 md:grid-cols-5">
              <select className="h-10 rounded-md border bg-white px-3" value={need.vendor_type} onChange={(e) => onChange("event_vendor_needs", draft.event_vendor_needs.map((item, itemIndex) => itemIndex === index ? { ...item, vendor_type: e.target.value as typeof item.vendor_type } : item))}>
                <option value="MERCHANDISE">Merchandise</option><option value="SERVICE">Service</option><option value="OTHER">Other</option>
              </select>
              <input className="h-10 rounded-md border px-3 md:col-span-2" placeholder="Type description" value={need.type_description || ""} onChange={(e) => onChange("event_vendor_needs", draft.event_vendor_needs.map((item, itemIndex) => itemIndex === index ? { ...item, type_description: e.target.value } : item))} />
              <input type="number" min="1" className="h-10 rounded-md border px-3" value={need.quantity} onChange={(e) => onChange("event_vendor_needs", draft.event_vendor_needs.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: Number(e.target.value) || 1 } : item))} />
              <div className="flex gap-2"><input type="number" min="0" step="0.01" className="h-10 min-w-0 flex-1 rounded-md border px-3" value={need.fee} onChange={(e) => onChange("event_vendor_needs", draft.event_vendor_needs.map((item, itemIndex) => itemIndex === index ? { ...item, fee: Number(e.target.value) || 0 } : item))} /><Button type="button" variant="outline" onClick={() => onChange("event_vendor_needs", draft.event_vendor_needs.filter((_, itemIndex) => itemIndex !== index))}>Remove</Button></div>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => onChange("event_vendor_needs", [...draft.event_vendor_needs, { vendor_type: "MERCHANDISE", type_description: "", quantity: 1, fee: 0 }])}>Add Vendor Need</Button>
          <label className="block text-sm">Marketplace Vendor Electricity Fee<input type="number" min="0" step="0.01" className="mt-1 h-10 w-full rounded-md border px-3" value={draft.event_vendor_electricity_fee} onChange={(e) => onChange("event_vendor_electricity_fee", e.target.value)} /></label>
        </div>
      </details>

      <details className={eventFormSectionClass}>
        <EventFormSectionSummary>Detailed Service Configuration</EventFormSectionSummary>
        <div className="mt-4 space-y-4">
          {renderCheckboxGroup("Plated Options", draft, onChange, "plated_options", platedOptions)}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="text-sm">Plated Courses<select className="mt-1 h-10 w-full rounded-md border bg-white px-3" value={draft.plated_number_of_courses} onChange={(e) => onChange("plated_number_of_courses", e.target.value)}><option value="">Not selected</option>{platedCourseOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
            <label className="text-sm">Entree Selection<select className="mt-1 h-10 w-full rounded-md border bg-white px-3" value={draft.plated_entree_selection} onChange={(e) => onChange("plated_entree_selection", e.target.value)}><option value="">Not selected</option>{entreeSelectionOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
            <label className="text-sm">Buffet Setup<select className="mt-1 h-10 w-full rounded-md border bg-white px-3" value={draft.buffet_setup} onChange={(e) => onChange("buffet_setup", e.target.value)}><option value="">Not selected</option>{buffetSetupOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
            <label className="text-sm">Station Setup Type<select className="mt-1 h-10 w-full rounded-md border bg-white px-3" value={draft.station_setup_type} onChange={(e) => onChange("station_setup_type", e.target.value)}><option value="">Not selected</option>{stationSetupOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
          </div>
          {renderCheckboxGroup("Plated Included Items", draft, onChange, "plated_included_items", platedIncludedItemOptions)}
          {renderCheckboxGroup("Buffet Included Items", draft, onChange, "buffet_included_items", cateringIncludedItemOptions)}
          <label className="block text-sm">Food Truck Menu Availability<select className="mt-1 h-10 w-full rounded-md border bg-white px-3" value={draft.food_truck_options} onChange={(e) => onChange("food_truck_options", e.target.value)}><option value="">Not selected</option>{foodTruckMenuOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
          {renderCheckboxGroup("Station Included Items", draft, onChange, "station_included_items", cateringIncludedItemOptions)}
          <label className="text-sm md:col-span-2 xl:col-span-4">Service Notes<textarea className="mt-1 min-h-24 w-full rounded-md border p-2" value={draft.service_notes} onChange={(e) => onChange("service_notes", e.target.value)} /></label>
        </div>
      </details>

      <details open className={eventFormSectionClass}>
        <EventFormSectionSummary>Tickets & Status</EventFormSectionSummary>
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
          {draft.ticket_sales_enabled ? (
            <>
              <label className="text-sm">GA Ticket Capacity<input type="number" min="0" className="mt-1 h-10 w-full rounded-md border bg-white px-3" value={draft.ga_ticket_quantity} onChange={(e) => onChange("ga_ticket_quantity", e.target.value)} /></label>
              <label className="text-sm">GA Ticket Price<input type="number" min="0" step="0.01" className="mt-1 h-10 w-full rounded-md border bg-white px-3" value={draft.ga_ticket_price} onChange={(e) => onChange("ga_ticket_price", e.target.value)} /></label>
              {draft.vip_section_enabled ? (
                <>
                  <label className="text-sm">VIP Ticket Capacity<input type="number" min="0" className="mt-1 h-10 w-full rounded-md border bg-white px-3" value={draft.vip_ticket_quantity} onChange={(e) => onChange("vip_ticket_quantity", e.target.value)} /></label>
                  <label className="text-sm">VIP Ticket Price<input type="number" min="0" step="0.01" className="mt-1 h-10 w-full rounded-md border bg-white px-3" value={draft.vip_ticket_price} onChange={(e) => onChange("vip_ticket_price", e.target.value)} /></label>
                </>
              ) : null}
            </>
          ) : null}
          <label className="text-sm md:col-span-2">
            Ticket URL
            <input
              className="mt-1 h-10 w-full rounded-md border bg-white px-3"
              value={draft.ticket_url}
              onChange={(e) => onChange("ticket_url", e.target.value)}
            />
          </label>
          <label className="text-sm md:col-span-2 xl:col-span-4">
            Admin Change Reason *
            <textarea className="mt-1 min-h-20 w-full rounded-md border bg-white px-3 py-2" value={draft.admin_reason} onChange={(e) => onChange("admin_reason", e.target.value)} placeholder="Required audit reason for creating or changing this canonical event" />
          </label>
        </div>
      </details>
    </div>
    );
  };

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
            {formatMarketplaceCalendarDate(event.event_date)}
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
      fieldName: "submission_summaries",
      accessor: (event) => (
        <div className="min-w-[320px] space-y-2">
          {(event.submission_summaries || []).length ? (
            event.submission_summaries?.map((submission) => (
              <Link
                key={`${submission.submission_type}-${submission.submission_id}`}
                href={`/marketplace-repository/submission?eventId=${encodeURIComponent(event.event_id)}&submissionType=${encodeURIComponent(submission.submission_type)}&submissionId=${encodeURIComponent(submission.submission_id)}`}
                className="flex items-center justify-between gap-3 rounded-md border p-2 text-xs hover:bg-slate-50"
              >
                <span>
                  <span className="block font-medium">{submission.business_name || submission.vendor_name || submission.event_vendor_profile_id || submission.food_truck_id || "Vendor"}</span>
                  <span className="text-muted-foreground">
                    {submissionTypeLabel(submission.submission_type)} · {submission.status}
                  </span>
                </span>
                <ExternalLink className="h-4 w-4 shrink-0" />
              </Link>
            ))
          ) : (
            <div className="text-xs text-muted-foreground">No submissions</div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Marketplace Repository</h1>
        <p className="text-sm text-muted-foreground">
          Create and correct canonical coordinator events. Vendor submissions and
          their files open as linked records instead of duplicate repository rows.
        </p>
      </div>

      <div className="rounded-md border bg-white p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Marketplace Events</h2>
            <p className="text-sm text-muted-foreground">
              Create events for existing coordinators, edit the full event record,
              manage event images, and open exact vendor submissions.
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
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => createEvent("DRAFT")}
                disabled={updatingId === "create-event"}
              >
                <Save className="mr-1 h-4 w-4" /> Save Draft
              </Button>
              <Button
                onClick={() => createEvent("PUBLISH")}
                disabled={updatingId === "create-event"}
              >
                <Save className="mr-1 h-4 w-4" /> Publish Event
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
                  variant="outline"
                  onClick={() => {
                    const event = events.find((item) => item.event_id === editingEventId);
                    if (event) saveEvent(event, "DRAFT");
                  }}
                  disabled={updatingId === editingEventId}
                >
                  <Save className="mr-1 h-4 w-4" /> Save Draft
                </Button>
                <Button
                  onClick={() => {
                    const event = events.find((item) => item.event_id === editingEventId);
                    if (event) saveEvent(event, "PUBLISH");
                  }}
                  disabled={updatingId === editingEventId}
                >
                  <Save className="mr-1 h-4 w-4" /> Publish Changes
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
            {events.find((item) => item.event_id === editingEventId)?.admin_draft?.validation_errors?.length ? (
              <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900">
                <div className="font-medium">This draft was retained. Correct the following before publishing:</div>
                <ul className="mt-1 list-disc pl-5">
                  {events.find((item) => item.event_id === editingEventId)?.admin_draft?.validation_errors?.map((item, index) => (
                    <li key={`${item.field}-${index}`}>{item.field}: {item.message}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {renderEventForm(eventDrafts[editingEventId], (field, value) =>
              updateEventDraft(editingEventId, field, value),
            )}
          </div>
        ) : null}

        <div className="mb-3 flex flex-wrap gap-2">
          <input
            className="h-10 min-w-[260px] rounded-md border px-3 text-sm"
            placeholder="Search event, bid, or vendor ID"
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
                    onClick={() => saveEvent(event, "PUBLISH")}
                    disabled={updatingId === event.event_id}
                  >
                    <Save className="mr-1 h-4 w-4" /> Publish
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
                  <Ban className="mr-1 h-4 w-4" /> Cancel Event
                </Button>
              ) : null}
            </div>
          )}
        />
      </div>

    </div>
  );
}
