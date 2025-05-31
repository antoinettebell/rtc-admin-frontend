"use client";
import * as React from "react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { settingApiService } from "@/services/setting-api-service";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import HtmlEditor from "@/components/ui/html-editor";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function Settings() {
  const [loading, setLoading] = useState<boolean>(false);

  const {
    data: result,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["site-setting"],
    queryFn: () => settingApiService.getFull(),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const onSaveTerms = (d: string) => {
    if (!d.trim()) return;
    setLoading(true);
    settingApiService
      .updateTerms(d)
      .then(() => {
        toast.success("Terms and conditions updated");
        refetch();
      })
      .catch((e) => {
        toast.error(e.response?.data?.message || "Error while updating");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const onSavePolicy = (d: string) => {
    if (!d.trim()) return;
    setLoading(true);
    settingApiService
      .updatePolicy(d)
      .then(() => {
        toast.success("Privacy policy updated");
        refetch();
      })
      .catch((e) => {
        toast.error(e.response?.data?.message || "Error while updating");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const onSaveAgreement = (d: string) => {
    if (!d.trim()) return;
    setLoading(true);
    settingApiService
      .updateAgreement(d)
      .then(() => {
        toast.success("Agreement updated");
        refetch();
      })
      .catch((e) => {
        toast.error(e.response?.data?.message || "Error while updating");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <>
      {isFetching ? (
        <div>
          <Skeleton className="h-[3.5rem] mb-4" />
          <Skeleton className="h-[3.5rem] mb-4" />
          <Skeleton className="h-[3.5rem] mb-4" />
          <Skeleton className="h-[3.5rem] mb-4" />
        </div>
      ) : (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>
              <div className="font-semibold text-[20px] my-2">
                Terms & conditions
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <HtmlEditor
                initialHtml={result?.data?.data?.setting?.termsConditions || ""}
                isLoading={loading}
                onSave={(d) => onSaveTerms(d)}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger>
              <div className="font-semibold text-[20px] my-2">
                Privacy policy
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <HtmlEditor
                initialHtml={result?.data?.data?.setting?.privacyPolicy || ""}
                isLoading={loading}
                onSave={(d) => onSavePolicy(d)}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger>
              <div className="font-semibold text-[20px] my-2">Agreement</div>
            </AccordionTrigger>
            <AccordionContent>
              <HtmlEditor
                initialHtml={result?.data?.data?.setting?.agreement || ""}
                isLoading={loading}
                onSave={(d) => onSaveAgreement(d)}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </>
  );
}
