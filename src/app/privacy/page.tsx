"use client";
import { useQuery } from "@tanstack/react-query";
import { publicApiService } from "@/services/public-api-service";

export default function Page() {
  const { data: result, isFetching } = useQuery({
    queryKey: ["overview"],
    queryFn: () => publicApiService.getPrivacyPolicy(),
    // keepPreviousData: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex justify-center">
          <div
            className="content-custom-display p-4"
            dangerouslySetInnerHTML={
              {
                __html: result?.data?.data?.privacyPolicy || "",
              } as {
                __html: string;
              }
            }
          ></div>
        </div>
      </div>
    </div>
  );
}
