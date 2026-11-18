"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { Archive, LoaderCircle, PlusCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Column, DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback/use-debounced-callback";
import {
  AmbassadorCode,
  ambassadorCodeApiService,
} from "@/services/ambassador-code-api-service";

const emptyForm = { code: "", firstName: "", lastName: "", email: "", phoneNumber: "" };

export default function AmbassadorCodesPage() {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [searchTerm, setSearchTerm] = useState("");
  const { data: result, isFetching, refetch } = useQuery({
    queryKey: ["ambassador-code-list", pagination.page, pagination.limit, searchTerm],
    queryFn: () => ambassadorCodeApiService.list(searchTerm, pagination.page, pagination.limit),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
  const records = useMemo(() => (result?.data?.data?.records || []) as AmbassadorCode[], [result]);
  const change = (key: keyof typeof emptyForm, value: string) => setForm((previous) => ({ ...previous, [key]: value }));
  const save = () => {
    const data = { ...form, code: form.code.trim().toUpperCase(), firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim(), phoneNumber: form.phoneNumber.trim() };
    if (Object.values(data).some((value) => !value)) return toast.error("Code, first name, last name, email, and phone number are required");
    setSaving(true);
    ambassadorCodeApiService.create(data).then(() => {
      toast.success("Ambassador code created"); setForm(emptyForm); refetch();
    }).catch((error) => toast.error(error.response?.data?.message || "Unable to create ambassador code"))
      .finally(() => setSaving(false));
  };
  const archive = (item: AmbassadorCode) => ambassadorCodeApiService.archive(item._id)
    .then(() => { toast.success("Ambassador code archived"); refetch(); })
    .catch((error) => toast.error(error.response?.data?.message || "Unable to archive ambassador code"));
  const search = useDebouncedCallback((value: string) => { setSearchTerm(value); setPagination((previous) => ({ ...previous, page: 1 })); }, 500);
  const columns: Column<AmbassadorCode>[] = [
    { header: "Referral Code", fieldName: "code", accessor: (item) => <span className="font-semibold">{item.code}</span> },
    { header: "Referer", fieldName: "firstName", accessor: (item) => `${item.firstName} ${item.lastName}` },
    { header: "Email", fieldName: "email", accessor: (item) => item.email },
    { header: "Phone", fieldName: "phoneNumber", accessor: (item) => item.phoneNumber },
    { header: "Status", fieldName: "isActive", accessor: (item) => <Badge variant={item.isActive ? "default" : "secondary"}>{item.isActive ? "Active" : "Archived"}</Badge> },
    { header: "Created", fieldName: "createdAt", accessor: (item) => item.createdAt ? dayjs(item.createdAt).format("DD MMM, YYYY") : "-" },
    { header: "", fieldName: "_id", accessor: (item) => item.isActive ? <Button size="sm" variant="outline" onClick={() => archive(item)}><Archive size={14} className="mr-1" />Archive</Button> : null },
  ];
  return <div className="space-y-6">
    <div><div className="font-semibold text-[28px] leading-[42px]">Ambassador Codes</div><p className="text-sm text-muted-foreground">Manage referral codes and the people who receive referral credit.</p></div>
    <section className="rounded-md border bg-white p-4"><h2 className="text-lg font-semibold">Add Ambassador Code</h2><div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <div className="space-y-2"><label className="text-sm font-medium">Referral Code</label><Input value={form.code} onChange={(event) => change("code", event.target.value)} placeholder="JANE10" className="uppercase" /></div>
      <div className="space-y-2"><label className="text-sm font-medium">First Name</label><Input value={form.firstName} onChange={(event) => change("firstName", event.target.value)} /></div>
      <div className="space-y-2"><label className="text-sm font-medium">Last Name</label><Input value={form.lastName} onChange={(event) => change("lastName", event.target.value)} /></div>
      <div className="space-y-2"><label className="text-sm font-medium">Email</label><Input type="email" value={form.email} onChange={(event) => change("email", event.target.value)} /></div>
      <div className="space-y-2"><label className="text-sm font-medium">Phone Number</label><Input value={form.phoneNumber} onChange={(event) => change("phoneNumber", event.target.value)} /></div>
    </div><div className="mt-4 flex gap-2"><Button disabled={saving} onClick={save}>{saving ? <LoaderCircle size={16} className="mr-2 animate-spin" /> : <PlusCircle size={16} className="mr-2" />}Create Ambassador Code</Button><Button variant="outline" onClick={() => setForm(emptyForm)}>Clear</Button></div></section>
    <section className="space-y-3"><div><h2 className="text-lg font-semibold">Ambassador Code History</h2><p className="text-sm text-muted-foreground">Active and archived referral codes, with their referer contact information.</p></div><DataTable columns={columns as any} data={records as any} totalRecords={result?.data?.data?.total || 0} isLoading={isFetching} onSearch={search} currentPage={pagination.page} pageSize={pagination.limit} setPagination={setPagination} hideColumnFilter /></section>
  </div>;
}
