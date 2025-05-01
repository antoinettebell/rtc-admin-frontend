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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 5xl:grid-cols-4 gap-4 *:data-[slot=card]:shadow-xs *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card">
        <Card
          className="@container/card cursor-pointer hover:shadow"
          onClick={() => {
            router.push("/vendor");
          }}
        >
          <CardHeader className="relative">
            <CardDescription>Approved Vendors</CardDescription>
            <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
              {data.totalVendor || 0}
            </CardTitle>
            <div className="absolute right-4 top-4">
              <SquareUserRound size={24} />
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
          className="@container/card cursor-pointer hover:shadow"
          onClick={() => {
            router.push("/vendor?status=PENDING");
          }}
        >
          <CardHeader className="relative">
            <CardDescription>Vendor Requests</CardDescription>
            <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
              {data.pendingVendor || 0}
            </CardTitle>
            <div className="absolute right-4 top-4">
              <SquareUserRound size={24} />
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
          className="@container/card cursor-pointer hover:shadow"
          onClick={() => {
            router.push("/vendor?status=REJECTED");
          }}
        >
          <CardHeader className="relative">
            <CardDescription>Vendors Rejected</CardDescription>
            <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
              {data.rejectedVendor || 0}
            </CardTitle>
            <div className="absolute right-4 top-4">
              <SquareUserRound size={24} />
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
      <div className="border-b"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 5xl:grid-cols-4 gap-4 *:data-[slot=card]:shadow-xs *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card">
        <Card
          className="@container/card cursor-pointer hover:shadow"
          onClick={() => {
            router.push("/user");
          }}
        >
          <CardHeader className="relative">
            <CardDescription>Total Customers</CardDescription>
            <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
              {data.totalUser || 0}
            </CardTitle>
            <div className="absolute right-4 top-4">
              <Users size={24} />
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
          className="@container/card cursor-pointer hover:shadow"
          onClick={() => {
            router.push("/user?status=inactive");
          }}
        >
          <CardHeader className="relative">
            <CardDescription>Inactive Customers</CardDescription>
            <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
              {data.inactiveUser || 0}
            </CardTitle>
            <div className="absolute right-4 top-4">
              <Users size={24} />
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
