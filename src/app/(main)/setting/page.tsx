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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Settings() {
  const [loading, setLoading] = useState<boolean>(false);

  const [freeDessertAmount, setFreeDessertAmount] = useState<string>("");
  const [freeDessertOrderCount, setFreeDessertOrderCount] = useState<string>("");
  const [isFreeDessertEnabled, setIsFreeDessertEnabled] = useState<boolean>(false);

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

  // Seed Free Dessert local state from fetched settings
  React.useEffect(() => {
    const st = result?.data?.data?.setting;
    if (!st) return;
    if (typeof st.freeDessertAmount === "number") {
      setFreeDessertAmount(String(st.freeDessertAmount));
    }
    if (typeof st.freeDessertOrderCount === "number") {
      setFreeDessertOrderCount(String(st.freeDessertOrderCount));
    }
    if (typeof st.isFreeDessertEnabled === "boolean") {
      setIsFreeDessertEnabled(!!st.isFreeDessertEnabled);
    }
  }, [result]);

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
          <AccordionItem value="free-dessert">
            <AccordionTrigger>
              <div className="font-semibold text-[20px] my-2">Free Dessert</div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-3 p-2">
                <div className="flex items-center gap-3">
                  <label className="min-w-[220px]">Enable Free Dessert</label>
                  <input
                    type="checkbox"
                    checked={isFreeDessertEnabled}
                    onChange={(e) => setIsFreeDessertEnabled(e.target.checked)}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="min-w-[220px]">Free Dessert Amount ($)</label>
                  <Input
                    type="number"
                    value={freeDessertAmount}
                    onChange={(e) => setFreeDessertAmount(e.target.value)}
                    placeholder="10"
                    className="max-w-[200px]"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="min-w-[220px]">Order Count Threshold</label>
                  <Input
                    type="number"
                    value={freeDessertOrderCount}
                    onChange={(e) => setFreeDessertOrderCount(e.target.value)}
                    placeholder="10"
                    className="max-w-[200px]"
                  />
                </div>
                <div>
                  <Button
                    disabled={loading}
                    onClick={() => {
                      const amt = Number(freeDessertAmount);
                      const cnt = Number(freeDessertOrderCount);
                      if (isNaN(amt) || amt < 0) {
                        toast.error("Amount must be 0 or greater");
                        return;
                      }
                      if (isNaN(cnt) || cnt < 1) {
                        toast.error("Order count must be 1 or greater");
                        return;
                      }
                      setLoading(true);
                      settingApiService
                        .updateFreeDessert({
                          freeDessertAmount: amt,
                          freeDessertOrderCount: cnt,
                          isFreeDessertEnabled,
                        })
                        .then(() => {
                          toast.success("Free dessert settings updated");
                          refetch();
                        })
                        .catch((e) =>
                          toast.error(
                            e.response?.data?.message || "Error while updating",
                          ),
                        )
                        .finally(() => setLoading(false));
                    }}
                  >
                    Save Settings
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
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
