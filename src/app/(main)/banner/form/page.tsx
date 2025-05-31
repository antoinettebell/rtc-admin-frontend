"use client";
import { ArrowLeft } from "lucide-react";
import * as React from "react";
import { Fragment, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Banner } from "@/interfaces/user-interface";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bannerApiService } from "@/services/banner-api-service";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FileSelect } from "@/components/file-select";
import { LoadingButton } from "@/components/loading-button";
import { fileApiService } from "@/services/file-api-service";
import { toast } from "sonner";
import dayjs from "dayjs";

export default function OrderDetail() {
  const router = useRouter();
  const isMounted = useRef(false);
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const id = searchParams.get("q");
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  const bannerSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
  });

  const form = useForm<z.infer<typeof bannerSchema>>({
    resolver: zodResolver(bannerSchema),
  });

  useEffect(() => {
    if (isMounted.current || !id) return;
    setLoading(true);
    bannerApiService
      .getById(id.toString())
      .then((res) => {
        form.reset({
          title: res.data.data.banner.title || "",
          description: res.data.data.banner.description || "",
          imageUrl: res.data.data.banner.imageUrl || "",
          fromDate: res.data.data.banner.fromDate
            ? dayjs(res.data.data.banner.fromDate).format("YYYY-MM-DD")
            : "",
          toDate: res.data.data.banner.toDate
            ? dayjs(res.data.data.banner.toDate).format("YYYY-MM-DD")
            : "",
        });
        console.log("===========", form.getValues());
      })
      .finally(() => {
        setLoading(false);
      });
    isMounted.current = true;
  }, []);

  const callAddBanner = () => {
    const values = form.getValues();
    if (!values.imageUrl?.trim()) {
      return;
    }
    bannerApiService
      .add(values as Banner)
      .then((res) => {
        toast.success("Banner added");
      })
      .catch((e) => {
        console.log("=============e");
        toast.error("Something went wrong while adding the banner");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const callUpdateBanner = () => {
    const values = form.getValues();
    if (!values.imageUrl?.trim() || !id) {
      return;
    }
    bannerApiService
      .update(id, values as Banner)
      .then((res) => {
        toast.success("Banner updated");
      })
      .catch((e) => {
        console.log("=============e");
        toast.error("Something went wrong while updating the banner");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const onSubmit = (v: z.infer<typeof bannerSchema>) => {
    const { force, ...values } = v;
    if (!file && !values.imageUrl?.trim()) {
      return;
    }
    setLoading(true);
    if (file) {
      fileApiService
        .upload(file)
        .then((res) => {
          setFile(null);
          form.reset({
            ...form.getValues(),
            imageUrl: res.data.data.file,
          });
          if (id) {
            callUpdateBanner();
            return;
          }
          callAddBanner();
        })
        .catch((e) => {
          console.log("=============e");
          toast.error("Something went wrong while uploading the file");
          setLoading(false);
        });
      return;
    }
    if (id) {
      callUpdateBanner();
      return;
    }
    callAddBanner();
  };

  return (
    <>
      <div className="flex justify-between flex-wrap mb-2">
        <div className="font-semibold text-[28px] leading-[42px] mb-2 flex gap-3 items-center">
          <Button variant="outline" onClick={() => router.replace("/banner")}>
            <ArrowLeft /> Back
          </Button>
          {id ? "Edit" : "Add"} Banner
        </div>
      </div>
      <Card className="w-full border-[#D9D9D9] shadow-none p-6 rounded-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="flex w-full">
              <FormField
                name="file"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Banner</FormLabel>
                    <FormControl ref={inputRef}></FormControl>
                    <FileSelect
                      className="max-w-[205px] h-[140px]"
                      field={field}
                      setFile={setFile}
                      removeImage={() => setFile(null)}
                      imgSrc={form.getValues().imageUrl}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex gap-4">
              <FormField
                name="title"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>
                      Title <sub>[Optional]</sub>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder="Title"
                        className=""
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="description"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>
                      Description <sub>[Optional]</sub>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder="Description"
                        className=""
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex gap-4">
              <FormField
                name="fromDate"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>
                      From date <sub>[Optional]</sub>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="From date"
                        className=""
                        type="date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="toDate"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>
                      To date <sub>[Optional]</sub>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="To date"
                        className=""
                        type="date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-center gap-2 pt-1">
              <Button
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  router.push("/banner");
                }}
                className="border-primary text-primary hover:text-primary hover:bg-white text-base font-medium min-w-[135px]"
              >
                Cancel
              </Button>
              <LoadingButton
                type="submit"
                isLoading={loading}
                disabled={
                  loading || (!form.getValues().imageUrl?.trim() && !file)
                }
                className="text-base font-medium min-w-[150px]"
              >
                {id ? "Save" : "Add"} Banner
              </LoadingButton>
            </div>
          </form>
        </Form>
      </Card>
    </>
  );
}
