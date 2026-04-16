"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Column, DataTable } from "@/components/ui/data-table";
import { transactionApiService } from "@/services/transaction-api-service";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback/use-debounced-callback";
import { useQuery } from "@tanstack/react-query";
import { NameDetail } from "@/components/ui/name-detail";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

import { useRouter, useSearchParams } from "next/navigation";
import dayjs from "dayjs";
import { LoadingButton } from "@/components/loading-button";
import { StringHelper } from "@/models/string-helper-model";

import { PieChart, Pie, Cell,Tooltip} from "recharts";

export default function Transactions() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState<any>(null);
  const [exporting, setExporting] = useState(false);
  const [transactionsType, setTransactionType] = useState<any>(null);

  const [startDate, setStartDate] = useState<any>(null);
  const [endDate, setEndDate] = useState<any>(null);

  // --- INIT FROM URL ---
  useEffect(() => {
    const st = searchParams.get("status");
    const TT = searchParams.get("transactionsType");

    const sd = searchParams.get("startDate");
    const ed = searchParams.get("endDate");

    if (st === "true") setStatus(true);
    else if (st === "false") setStatus(false);
    else setStatus(null);
    
    setTransactionType(TT === "ALL" || TT === null ? null : TT);
    setStartDate(sd || null);
    setEndDate(ed || null);
  }, [searchParams]);

  // --- SYNC URL ---
  useEffect(() => {
    const params = new URLSearchParams();

    params.set("p", String(pagination.page));
    params.set("l", String(pagination.limit));
    if (status !== null) params.set("status", String(status));
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
     params.set("transactionsType", transactionsType ?? "ALL");

    router.replace(`/transactions?${params.toString()}`);
  }, [pagination, status,transactionsType, startDate, endDate]);

  // --- API CALL ---
  const { data: result, isFetching } = useQuery({
    queryKey: [
      "transaction-list",
      pagination.page,
      pagination.limit,
      searchTerm,
      status,
      transactionsType,
      startDate,
      endDate,
    ],
    queryFn: () =>
      transactionApiService.list(
        searchTerm,
        pagination.page,
        pagination.limit,
        status,
        transactionsType,
        startDate,
        endDate
      ),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  // --- SEARCH ---
  const debouncedSearch = useDebouncedCallback((value: string) => {
    setSearchTerm(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, 500);

  // --- EXPORT CSV ---
  const callExport = () => {
    if (!result?.data?.data?.total) return;
    setExporting(true);

    transactionApiService
      .list(
        searchTerm,
        1,
        result?.data?.data?.total,
        status,
        startDate,
        endDate
      )
      .then((res) => {
        const rows = res.data.data.records;
        const data = rows.map((x) => ({
          userId:  x?.userId,
          Customer: `${x?.user?.firstName || ""} ${x?.user?.lastName || ""}`,
          Email: x?.user?.email,
          Amount: x.amount,
          Invoice: x?.invoiceNumber ||"N/A",
          OrderId: x.orderId || "N/A",
          transactionId: x.transactionId || "N/A",
          TransactionType:getTypeLabel(x.type),
          RefundID:(x.type === "REFUND" ? x.uniqueId + (" (" + x.response_type + ")") : "-"),
          Method: x?.paymentMethod || "N/A",
          Status: x.success ? "SUCCESS" : "FAILED",
          Error: x.success ? "-" : x.errorMessage,
          CreatedAt: dayjs(x.createdAt).format("YYYY-MM-DD HH:mm"),
        }));

        StringHelper.downloadCSV(
          data,
          `transactions_${dayjs().format("YYYY-MM-DD-HH-mm-ss")}`
        );
      })
      .finally(() => setExporting(false));
  };

  const typeColor = {
  CHECKOUT: "bg-blue-600",
  REFUND: "bg-orange-600",
  VOID: "bg-red-600",
  NONE: "bg-gray-500",
};
  const getTypeLabel = (type) => {
  return type === "CHECKOUT" ? "PAYOUT" : type;
};



  const columns: Column<any>[] = [
      {
        header: "Name",
        fieldName: "firstName",
        accessor: (d) => (
          <NameDetail
            name={`${d?.user?.firstName|| ""} ${d?.user?.lastName || ""}`}
            email={d?.user?.email||""}
            imgSrc={d?.user?.profilePic}
            avatarClassName={"object-contain"}
          />
        ),
        // sortable: true,
        className: "!px-4 w-[270px]",
        canNotHide: true,
      },
      {
        header: "Invoice Number",
        fieldName: "invoiceNumber",
        accessor: (d) => d.invoiceNumber || "N/A",
      },
     { header: "Transaction Id",
        fieldName: "transactionId",
        accessor: (d) => d.transactionId || "N/A" 
      },

     {
        header: "Order ID",
        fieldName: "orderId",
        accessor: (d) => (d.orderId ? d.orderId : "N/A"),
      },
  
      {
        header: "Amount",
        fieldName: "amount",
        accessor: (d) => `$${d.amount}`,
      },
      {
        header: "Method",
        fieldName: "paymentMethod",
        accessor: (d) =>  (d.paymentMethod ? d.paymentMethod : "N/A"),
      },
       {
        header: "Transactions Type",
        fieldName: "type",
        accessor: (d) => (
          <span
            className={`px-2 py-1 rounded text-white text-sm ${
              typeColor[d.type] || "bg-gray-500"
            }`}
          >
            {getTypeLabel(d.type)}
          </span>
        ),
      },
        {
        header: "Refund ID (Type)",
        fieldName: "paymentMethod",
        accessor: (d) =>  (d.type === "REFUND" ? d.uniqueId + (" (" + d.response_type + ")") : "-"),
      },
      {
        header: "Status",
        fieldName: "success",
        accessor: (d) => (
          <span
            className={`px-2 py-1 rounded text-white text-sm ${
              d.success ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {d.success ? "SUCCESS" : "FAILED"}
          </span>
        ),
      },
  
      {
        header: "Error Message",
        fieldName: "errorMessage",
        accessor: (d) =>
          d.success
            ? "-"
            : `(${d?.errorCode || ""}) ${d?.errorMessage || "-"}`,
      },
  
      {
        header: "Created",
        fieldName: "createdAt",
        accessor: (d) => dayjs(d.createdAt).format("YYYY-MM-DD HH:mm"),
      },
      
    ];

  // --- STATUS FILTER ---
  const statusSelect = () => (
    <Select
      value={status === null ? "null" : String(status)}
      onValueChange={(val) => {
        if (val === "true") setStatus(true);
        else if (val === "false") setStatus(false);
        else setStatus(null);

        setPagination((p) => ({ ...p, page: 1 }));
      }}
    >
      <SelectTrigger className="!h-10 min-w-[140px] bg-gray-100">
        <SelectValue placeholder="Status" />
      </SelectTrigger>

      <SelectContent>
        <SelectGroup>
          <SelectItem value="null">All Status</SelectItem>
          <SelectItem value="true">Success</SelectItem>
          <SelectItem value="false">Failed</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );

 const transactionSelect = () => (
    <Select
      value={transactionsType === null ? "ALL" : transactionsType}
      onValueChange={(val) => {
        setTransactionType(val === "ALL" ? null : val);
        setPagination((p) => ({ ...p, page: 1 }));
      }}
    >
      <SelectTrigger className="!h-10 min-w-[140px] bg-gray-100">
        <SelectValue placeholder="Type" />
      </SelectTrigger>

      <SelectContent>
        <SelectGroup>
          <SelectItem value="ALL">All Transactions</SelectItem>
          <SelectItem value="CHECKOUT">Payout</SelectItem>
          <SelectItem value="REFUND">Refund</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );

  // --- DATE FILTER ---
  const dateFilters = () => (
    <div className="flex gap-3 items-center">
      <input
        type="date"
        className="border rounded-lg px-3 py-2 text-sm"
        value={startDate || ""}
        onChange={(e) => {
          const v = e.target.value;
          if (endDate && dayjs(v).isAfter(endDate)) {
            toast.error("Start date cannot be greater than end date");
            return;
          }
          setStartDate(v);
          setPagination((p) => ({ ...p, page: 1 }));
        }}
      />

      <span className="text-gray-400">to</span>

      <input
        type="date"
        className="border rounded-lg px-3 py-2 text-sm"
        value={endDate || ""}
        onChange={(e) => {
          const v = e.target.value;
          if (startDate && dayjs(v).isBefore(startDate)) {
            toast.error("End date cannot be less than start date");
            return;
          }
          setEndDate(v);
          setPagination((p) => ({ ...p, page: 1 }));
        }}
      />
    </div>
  );

  // --- SMALL INLINE GAUGE CHART ---
  // const SmallGaugeChart = ({ success = 0, failed = 0 }) => {
  //   const total = success + failed;
  //   const pct = total ? Math.round((success / total) * 100) : 0;

  //   const data = [
  //     { name: "Success", value: pct },
  //     { name: "Other", value: 100 - pct }
  //   ];

  //   const size = 120;
  //   const cx = size / 2;
  //   const cy = size / 2;
  //   const innerR = size * 0.28;
  //   const outerR = size * 0.45;

  //   const angle = (pct / 100) * 180;
  //   const RAD = Math.PI / 180;

  //   const nx = cx + (outerR - 8) * Math.cos((180 - angle) * RAD);
  //   const ny = cy - (outerR - 8) * Math.sin((180 - angle) * RAD);

  //   return (
  //     <div className="flex flex-col items-center scale-95">
  //       <PieChart width={size} height={size / 1.4}>
  //         <Pie
  //           data={data}
  //           cx={cx}
  //           cy={cy}
  //           startAngle={180}
  //           endAngle={0}
  //           innerRadius={innerR}
  //           outerRadius={outerR}
  //           dataKey="value"
  //         >
  //           {data.map((_, i) => (
  //             <Cell key={i} fill={i === 0 ? "#22c55e" : "#e5e7eb"} />
  //           ))}
  //         </Pie>

  //         <g>
  //           <line
  //             x1={cx}
  //             y1={cy}
  //             x2={nx}
  //             y2={ny}
  //             stroke="#ef4444"
  //             strokeWidth={3}
  //             strokeLinecap="round"
  //           />
  //           <circle cx={cx} cy={cy} r={4} fill="#333" />
  //         </g>
  //       </PieChart>

  //       <div className="text-sm font-semibold">{pct}%</div>
  //     </div>
  //   );
  // };
const SmallGaugeChart = ({ success = 0, failed = 0 }) => {
  const total = success + failed;
  const successPct = total ? Math.round((success / total) * 100) : 0;
  const failedPct = total ? Math.round((failed / total) * 100) : 0;

  const data = [
    { name: "Success", value: successPct, count: success },
    { name: "Failed", value: failedPct, count: failed }
  ];

  const COLORS = ["#22c55e", "#ef4444"]; // green = success, red = failed

  const size = 120;
  const cx = size / 2;
  const cy = size / 2;
  const innerR = size * 0.28;
  const outerR = size * 0.45;

  const angle = (successPct / 100) * 180; // NEEDLE SUCCESS POINT
  const RAD = Math.PI / 180;

  const nx = cx + (outerR - 8) * Math.cos((180 - angle) * RAD);
  const ny = cy - (outerR - 8) * Math.sin((180 - angle) * RAD);

  return (
    <div className="flex flex-col items-center scale-95">

      <PieChart width={size} height={size / 1.4}>
        {/* TOOLTIP WITH PERCENTAGE */}
        <Tooltip
          formatter={(value, name, props) => {
            return [`${value}% (${props.payload.count})`, name];
          }}
        />

        <Pie
          data={data}
          cx={cx}
          cy={cy}
          startAngle={180}
          endAngle={0}
          innerRadius={innerR}
          outerRadius={outerR}
          dataKey="value"
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={COLORS[i]} />
          ))}
        </Pie>

        {/* NEEDLE */}
        <g>
          <line
            x1={cx}
            y1={cy}
            x2={nx}
            y2={ny}
            stroke="#374151"
            strokeWidth={4}
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r={4} fill="#111" />
        </g>
      </PieChart>

      <div className="text-sm font-semibold">{successPct}%</div>
      <div className="text-xs text-gray-500">
        {success} Success • {failed} Failed
      </div>
    </div>
  );
};
  return (
    <>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-semibold text-3xl">Payment Transactions</h1>

        <LoadingButton
          isLoading={exporting}
          disabled={exporting}
          onClick={callExport}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4"
        >
          Export CSV
        </LoadingButton>
      </div>

      {/* SUMMARY + CHART (IN SAME ROW) */}
      <div className="
        grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5
        gap-5 mb-8">

        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="text-sm text-gray-500">Total Transactions</div>
          <div className="text-2xl font-bold">
            {result?.data?.data?.total || 0}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="text-sm text-gray-500">Success Count</div>
          <div className="text-2xl font-bold text-green-600">
            {result?.data?.data?.successCount || 0}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="text-sm text-gray-500">Failed Count</div>
          <div className="text-2xl font-bold text-red-600">
            {result?.data?.data?.failedCount || 0}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="text-sm text-gray-500">Total Success Amount</div>
          <div className="text-2xl font-bold">
            ${result?.data?.data?.totalSuccessAmount || 0}
          </div>
        </div>

        {/* INLINE SMALL GAUGE CHART */}
        <div className="bg-white rounded-xl shadow-sm border p-4 flex items-center justify-center">
          <SmallGaugeChart
            success={result?.data?.data?.successCount || 0}
            failed={result?.data?.data?.failedCount || 0}
          />
        </div>
      </div>

      {/* FILTERS */}
      {/* <div className="
        bg-white rounded-xl shadow-sm border p-5 mb-6
        flex flex-wrap items-end gap-5">

        <div className="min-w-[240px]">
          <input
            type="text"
            placeholder="Search..."
            className="border rounded-lg w-full px-3 py-2 text-sm"
            onChange={(e) => debouncedSearch(e.target.value)}
          />
        </div>

        <div>{statusSelect()}</div>

        <div>{dateFilters()}</div>

      </div> */}

      {/* TABLE */}
      <DataTable
        columns={columns as any}
        data={(result?.data?.data?.records || []) as any}
        totalRecords={result?.data?.data?.total || 0}
        isLoading={isFetching}
        currentPage={pagination.page}
        pageSize={pagination.limit}
        onSearch={(s: string) => debouncedSearch(s)}
        setPagination={setPagination}
         extraTemplate={
          <div className="flex flex-wrap gap-4 items-end w-full">

            {/* STATUS FILTER */}
            <div className="flex flex-col">
              {/* <label className="text-sm text-gray-600 mb-1">Status</label> */}
              {statusSelect()}
            </div>
             <div className="flex flex-col">
              {/* <label className="text-sm text-gray-600 mb-1">Status</label> */}
              {transactionSelect()}
            </div>

            {/* DATE FILTERS */}
            <div className="flex flex-col">
              {/* <label className="text-sm text-gray-600 mb-1">Date Range</label> */}
              {dateFilters()}
            </div>
             

          </div>  
        }
        hideColumnFilter={true}
      />
    </>
  );
}
