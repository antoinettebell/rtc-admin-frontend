"use client";
import { SectionCards } from "@/components/core/section-cards";
import { useQuery } from "@tanstack/react-query";
import { userApiService } from "@/services/user-api-service";

export default function Page() {
  const { data: result, isFetching } = useQuery({
    queryKey: ["overview"],
    queryFn: () => userApiService.getOverview(),
    // keepPreviousData: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 md:gap-6">
          <SectionCards
            isLoading={isFetching}
            data={result?.data.data as any}
          />
        </div>
      </div>
    </div>
  );
}
