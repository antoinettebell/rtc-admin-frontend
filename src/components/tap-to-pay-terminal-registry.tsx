"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Copy, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { foodTruckApiService } from "@/services/food-truck-api-service";

type Terminal = {
  _id: string;
  device_id: string;
  device_id_suffix?: string;
  device_label?: string;
  assigned_user_type?: string;
  employee_internal_id?: string;
  environment?: string;
  status?: "ACTIVE" | "HISTORICAL";
  reactivation_required?: boolean;
  reactivation_reason?: string;
  registered_at?: string;
  last_seen_at?: string;
  last_activation_status?: string;
  last_activation_at?: string;
  last_activation_error_code?: string;
  last_activation_error_message?: string;
};

type DiagnosticEvent = {
  _id: string;
  event_type: string;
  actor_type?: string;
  environment?: string;
  device_id_suffix?: string;
  device_label?: string;
  error_code?: string;
  error_message?: string;
  occurred_at?: string;
};

const dateTime = (value?: string) => value ? new Date(value).toLocaleString() : "—";

export function TapToPayTerminalRegistry({
  foodTruckId,
  employeeInternalId = null,
}: {
  foodTruckId: string;
  employeeInternalId?: string | null;
}) {
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [selectedTerminalId, setSelectedTerminalId] = React.useState("");
  const [showAdd, setShowAdd] = React.useState(false);
  const [adding, setAdding] = React.useState(false);
  const [newDevice, setNewDevice] = React.useState({
    device_id: "",
    device_label: "",
    environment: "production" as "production" | "test",
    status: "ACTIVE" as "ACTIVE" | "HISTORICAL",
    reason: "Backfilled from CyberSource Acceptance Devices",
  });
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["tap-to-pay-terminals", foodTruckId],
    queryFn: async () => {
      const response = await foodTruckApiService.listTapToPayTerminals(foodTruckId);
      return response.data.data;
    },
    enabled: !!foodTruckId,
  });
  const terminals = React.useMemo(
    () => (data?.terminals || []) as Terminal[],
    [data?.terminals],
  );
  const events = (data?.events || []) as DiagnosticEvent[];
  const selectedTerminal = terminals.find((terminal) => terminal._id === selectedTerminalId)
    || terminals[0];

  React.useEffect(() => {
    if (employeeInternalId) {
      const employeeTerminal = terminals.find(
        (terminal) => terminal.employee_internal_id === employeeInternalId,
      );
      if (employeeTerminal) {
        setSelectedTerminalId(employeeTerminal._id);
      }
    }
  }, [employeeInternalId, terminals]);

  React.useEffect(() => {
    setSelectedTerminalId((current) =>
      terminals.length && !terminals.some((terminal) => terminal._id === current)
        ? terminals[0]._id
        : current,
    );
  }, [terminals]);

  const requestedEmployeeTerminal = employeeInternalId
    ? terminals.find((terminal) => terminal.employee_internal_id === employeeInternalId)
    : null;

  const update = async (
    terminal: Terminal,
    action: "REQUIRE_REACTIVATION" | "CLEAR_REACTIVATION" | "MARK_HISTORICAL" | "RESTORE_ACTIVE" | "UPDATE_LABEL",
  ) => {
    let reason: string | null = null;
    let deviceLabel: string | null | undefined;
    if (action === "REQUIRE_REACTIVATION") {
      reason = window.prompt("Why must this iPhone reactivate?", "Troubleshooting requested by RTC support");
      if (reason === null) return;
    }
    if (action === "UPDATE_LABEL") {
      deviceLabel = window.prompt("Device label", terminal.device_label || "iPhone");
      if (deviceLabel === null) return;
    }
    setUpdatingId(terminal._id);
    try {
      await foodTruckApiService.updateTapToPayTerminal(foodTruckId, terminal._id, {
        action,
        reason,
        device_label: deviceLabel,
      });
      await refetch();
      toast.success("Tap to Pay device updated.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || "Unable to update device.");
    } finally {
      setUpdatingId(null);
    }
  };

  const addExistingDevice = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newDevice.device_id.trim()) {
      toast.error("Enter the complete Acceptance Devices ID.");
      return;
    }
    setAdding(true);
    try {
      const response = await foodTruckApiService.addTapToPayTerminal(foodTruckId, {
        ...newDevice,
        device_id: newDevice.device_id.trim(),
        device_label: newDevice.device_label.trim(),
        reason: newDevice.reason.trim(),
      });
      const terminalId = response.data.data.terminal?._id;
      await refetch();
      if (terminalId) setSelectedTerminalId(terminalId);
      setShowAdd(false);
      setNewDevice({
        device_id: "",
        device_label: "",
        environment: "production",
        status: "ACTIVE",
        reason: "Backfilled from CyberSource Acceptance Devices",
      });
      toast.success("Existing Tap to Pay device added.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.response?.data?.error?.message || error?.message || "Unable to add device.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Tap to Pay Devices</h2>
          <p className="text-sm text-muted-foreground">
            Full Acceptance Devices IDs, current state, reactivation controls, and safe diagnostics. Historical devices are retained for support.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setShowAdd((value) => !value)}>
            <Plus className="mr-2 h-4 w-4" /> Add Existing Device
          </Button>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {showAdd ? (
        <form onSubmit={addExistingDevice} className="rounded-lg border p-4 space-y-4">
          <div>
            <h3 className="font-semibold">Add Existing CyberSource Device</h3>
            <p className="text-sm text-muted-foreground">Copy the complete ID from CyberSource Acceptance Devices. This action is retained in the support history.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium">
              Full Acceptance Devices ID
              <input className="mt-1 w-full rounded-md border bg-background px-3 py-2 font-mono" value={newDevice.device_id} onChange={(event) => setNewDevice((value) => ({ ...value, device_id: event.target.value }))} required />
            </label>
            <label className="text-sm font-medium">
              Device label
              <input className="mt-1 w-full rounded-md border bg-background px-3 py-2" placeholder="Vendor iPhone" value={newDevice.device_label} onChange={(event) => setNewDevice((value) => ({ ...value, device_label: event.target.value }))} />
            </label>
            <label className="text-sm font-medium">
              Environment
              <select className="mt-1 w-full rounded-md border bg-background px-3 py-2" value={newDevice.environment} onChange={(event) => setNewDevice((value) => ({ ...value, environment: event.target.value as "production" | "test" }))}>
                <option value="production">Production</option>
                <option value="test">Test</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              Initial status
              <select className="mt-1 w-full rounded-md border bg-background px-3 py-2" value={newDevice.status} onChange={(event) => setNewDevice((value) => ({ ...value, status: event.target.value as "ACTIVE" | "HISTORICAL" }))}>
                <option value="ACTIVE">Active</option>
                <option value="HISTORICAL">Historical</option>
              </select>
            </label>
          </div>
          <label className="block text-sm font-medium">
            Support note
            <input className="mt-1 w-full rounded-md border bg-background px-3 py-2" value={newDevice.reason} onChange={(event) => setNewDevice((value) => ({ ...value, reason: event.target.value }))} />
          </label>
          <div className="flex gap-2">
            <Button type="submit" disabled={adding}>{adding ? "Adding…" : "Add Device"}</Button>
            <Button type="button" variant="outline" onClick={() => setShowAdd(false)} disabled={adding}>Cancel</Button>
          </div>
        </form>
      ) : null}

      {employeeInternalId && !isFetching && terminals.length > 0 && !requestedEmployeeTerminal ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          This employee does not have a registered Tap to Pay device yet. All vendor devices remain available below for support review.
        </div>
      ) : null}

      {terminals.length === 0 ? (
        <div className="rounded-lg border p-6 text-sm text-muted-foreground">No Tap to Pay devices have been registered.</div>
      ) : (
        <div className="space-y-3">
          <label className="block max-w-2xl text-sm font-medium">
            Registered and historical devices
            <select
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 font-mono text-sm"
              value={selectedTerminal?._id || ""}
              onChange={(event) => setSelectedTerminalId(event.target.value)}
            >
              {terminals.map((terminal) => (
                <option key={terminal._id} value={terminal._id}>
                  {terminal.device_label || "iPhone"} — {terminal.device_id} — {terminal.status || "ACTIVE"}
                </option>
              ))}
            </select>
          </label>
          <p className="text-xs text-muted-foreground">
            Select any current or historical device to view its complete support record.
          </p>
        </div>
      )}

      {selectedTerminal ? [selectedTerminal].map((terminal) => (
        <div key={terminal._id} className="rounded-lg border p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <strong>{terminal.device_label || "iPhone"}</strong>
              <Badge variant={terminal.status === "ACTIVE" ? "default" : "secondary"}>{terminal.status || "ACTIVE"}</Badge>
              {terminal.reactivation_required ? <Badge variant="destructive">Reactivation required</Badge> : null}
              <Badge variant="outline">{terminal.environment || "PRODUCTION"}</Badge>
            </div>
            <Button size="sm" variant="outline" onClick={() => update(terminal, "UPDATE_LABEL")} disabled={updatingId === terminal._id}>Edit label</Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 text-sm">
            <div>
              <div className="text-muted-foreground">Full device / terminal ID</div>
              <div className="flex items-center gap-2 break-all font-mono">
                {terminal.device_id}
                <Button size="icon" variant="ghost" title="Copy full ID" onClick={() => navigator.clipboard.writeText(terminal.device_id).then(() => toast.success("Device ID copied."))}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div><span className="text-muted-foreground">Assigned to:</span> {terminal.assigned_user_type || "—"}{terminal.employee_internal_id ? ` (${terminal.employee_internal_id})` : ""}</div>
            <div><span className="text-muted-foreground">Registered:</span> {dateTime(terminal.registered_at)}</div>
            <div><span className="text-muted-foreground">Last seen:</span> {dateTime(terminal.last_seen_at)}</div>
            <div><span className="text-muted-foreground">Last activation:</span> {terminal.last_activation_status || "UNKNOWN"} · {dateTime(terminal.last_activation_at)}</div>
            <div><span className="text-muted-foreground">Last error:</span> {[terminal.last_activation_error_code, terminal.last_activation_error_message].filter(Boolean).join(" — ") || "None"}</div>
          </div>

          {terminal.reactivation_reason ? <div className="rounded bg-amber-50 p-2 text-sm text-amber-900">Reason: {terminal.reactivation_reason}</div> : null}
          <div className="flex flex-wrap gap-2">
            {terminal.reactivation_required ? (
              <Button size="sm" variant="outline" onClick={() => update(terminal, "CLEAR_REACTIVATION")} disabled={updatingId === terminal._id}>Clear reactivation flag</Button>
            ) : (
              <Button size="sm" variant="destructive" onClick={() => update(terminal, "REQUIRE_REACTIVATION")} disabled={updatingId === terminal._id}>Require reactivation</Button>
            )}
            {terminal.status === "ACTIVE" ? (
              <Button size="sm" variant="outline" onClick={() => update(terminal, "MARK_HISTORICAL")} disabled={updatingId === terminal._id}>Mark historical</Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => update(terminal, "RESTORE_ACTIVE")} disabled={updatingId === terminal._id}>Restore active</Button>
            )}
          </div>
        </div>
      )) : null}

      <div className="rounded-lg border p-4">
        <h3 className="font-semibold">Recent Activation Diagnostics</h3>
        <p className="mb-3 text-sm text-muted-foreground">Safe operational facts only; activation codes and payment data are never retained.</p>
        <div className="space-y-2">
          {events.length === 0 ? <p className="text-sm text-muted-foreground">No diagnostics recorded.</p> : events.map((event) => (
            <div key={event._id} className="grid gap-1 border-t py-2 text-sm md:grid-cols-5">
              <span>{dateTime(event.occurred_at)}</span>
              <strong>{event.event_type}</strong>
              <span>{event.device_label || "iPhone"} · …{event.device_id_suffix || "unknown"}</span>
              <span>{event.actor_type || "—"} · {event.environment || "PRODUCTION"}</span>
              <span className="text-red-700">{[event.error_code, event.error_message].filter(Boolean).join(" — ") || "—"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
