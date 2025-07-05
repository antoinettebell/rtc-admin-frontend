"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

type FullscreenImageProps = {
  src: string;
  alt?: string;
  className?: string;
  children: React.ReactNode;
};

export default function PhotoViewer({
  src,
  alt,
  className,
  children,
}: FullscreenImageProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="p-0 bg-transparent border-none shadow-none">
        <img
          src={src}
          alt={alt}
          className="max-h-screen max-w-screen mx-auto"
        />
      </DialogContent>
    </Dialog>
  );
}
