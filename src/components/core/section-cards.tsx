import { SquareUserRound, Users } from "lucide-react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

interface IAttribs {
  isLoading: boolean;
  data: {
    totalVendor: number;
    pendingVendor: number;
    rejectedVendor: number;
    totalUser: number;
    inactiveUser: number;
  };
}

export function SectionCards({ data, isLoading }: IAttribs) {
  const router = useRouter();
  return isLoading ? (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 5xl:grid-cols-4 gap-4 *:data-[slot=card]:shadow-xs *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card">
      {[1, 1, 1, 1, 1, 1].map((_, i) => (
        <Skeleton key={`${i}-page-loading`} className="h-[175px]" />
      ))}
    </div>
  ) : (
    <>
      <div className="flex items-center gap-3">
        <h2 className="whitespace-nowrap font-semibold text-lg">
          Vendor Statistics
        </h2>
        <div className="border-b w-full"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 5xl:grid-cols-4 gap-4 *:data-[slot=card]:shadow-xs *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card">
        <Card
          className="@container/card cursor-pointer bg-gradient-to-br shadow-lg transition-all hover:shadow-xl from-green-50 to-green-100 border-green-200 shadow-green-100/50"
          onClick={() => {
            router.push("/vendor");
          }}
        >
          <CardHeader className="relative">
            <CardDescription className="text-gray-600 font-semibold">
              Approved Vendors
            </CardDescription>
            <CardTitle className="@[250px]/card:text-3xl text-3xl font-bold tabular-nums text-green-700">
              {data.totalVendor || 0}
            </CardTitle>
            <div className="absolute right-4 top-4 rounded p-2 border border-green-200">
              <SquareUserRound size={24} className="text-green-600" />
            </div>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Total approved vendors on platform
            </div>
            <div className="text-muted-foreground">
              Vendors are currently approved
            </div>
          </CardFooter>
        </Card>
        <Card
          className="@container/card cursor-pointer bg-gradient-to-br shadow-lg transition-all hover:shadow-xl from-amber-50 to-amber-100 border-amber-200 shadow-amber-100/50"
          onClick={() => {
            router.push("/vendor?status=PENDING");
          }}
        >
          <CardHeader className="relative">
            <CardDescription className="text-gray-600 font-semibold">
              Vendor Requests
            </CardDescription>
            <CardTitle className="@[250px]/card:text-3xl text-3xl font-bold tabular-nums text-amber-700">
              {data.pendingVendor || 0}
            </CardTitle>
            <div className="absolute right-4 top-4 rounded p-2 border border-amber-200">
              <SquareUserRound size={24} className="text-amber-600" />
            </div>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Vendor requests to be reviewed
            </div>
            <div className="text-muted-foreground">Newly joined vendors</div>
          </CardFooter>
        </Card>
        <Card
          className="@container/card cursor-pointer bg-gradient-to-br shadow-lg transition-all hover:shadow-xl from-red-50 to-red-100 border-red-200 shadow-red-100/50"
          onClick={() => {
            router.push("/vendor?status=REJECTED");
          }}
        >
          <CardHeader className="relative">
            <CardDescription className="text-gray-600 font-semibold">
              Vendors Rejected
            </CardDescription>
            <CardTitle className="@[250px]/card:text-3xl text-3xl font-bold tabular-nums text-red-700">
              {data.rejectedVendor || 0}
            </CardTitle>
            <div className="absolute right-4 top-4 rounded p-2 border border-red-200">
              <SquareUserRound size={24} className="text-red-600" />
            </div>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Vendor that are been rejected
            </div>
            <div className="text-muted-foreground">
              All the rejected requests
            </div>
          </CardFooter>
        </Card>
      </div>
      <div className="flex items-center gap-3 mt-4">
        <h2 className="whitespace-nowrap font-semibold text-lg">
          Customer Statistics
        </h2>
        <div className="border-b w-full"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 5xl:grid-cols-4 gap-4 *:data-[slot=card]:shadow-xs *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card">
        <Card
          className="@container/card cursor-pointer bg-gradient-to-br shadow-lg transition-all hover:shadow-xl from-purple-50 to-purple-100 border-purple-200 shadow-purple-100/50"
          onClick={() => {
            router.push("/user");
          }}
        >
          <CardHeader className="relative">
            <CardDescription className="text-gray-600 font-semibold">
              Total Customers
            </CardDescription>
            <CardTitle className="@[250px]/card:text-3xl text-3xl font-bold tabular-nums text-purple-700">
              {data.totalUser || 0}
            </CardTitle>
            <div className="absolute right-4 top-4 rounded p-2 border border-purple-200">
              <Users size={24} className="text-purple-600" />
            </div>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Total customers across the platform
            </div>
            <div className="text-muted-foreground">
              Number of total Customers
            </div>
          </CardFooter>
        </Card>
        <Card
          className="@container/card cursor-pointer bg-gradient-to-br shadow-lg transition-all hover:shadow-xl from-slate-50 to-slate-100 border-slate-200 shadow-slate-100/50"
          onClick={() => {
            router.push("/user?status=inactive");
          }}
        >
          <CardHeader className="relative">
            <CardDescription className="text-gray-600 font-semibold">
              Inactive Customers
            </CardDescription>
            <CardTitle className="@[250px]/card:text-3xl text-3xl font-bold tabular-nums text-slate-700">
              {data.inactiveUser || 0}
            </CardTitle>
            <div className="absolute right-4 top-4 rounded p-2 border border-slate-200">
              <Users size={24} className="text-slate-600" />
            </div>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Total Inactive Customers
            </div>
            <div className="text-muted-foreground">
              Number of total inactive Customers
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
