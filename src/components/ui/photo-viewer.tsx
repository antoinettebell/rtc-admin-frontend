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
      <DialogContent className="p-0 bg-transparent border-none shadow-none max-w-[90vw] max-h-[90vh] [&>button]:text-white [&>button]:hover:text-gray-200">
        <div className="flex items-center justify-center w-full h-full p-4">
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            style={{
              width: 'auto',
              height: 'auto',
              maxWidth: 'min(90vw, 800px)',
              maxHeight: 'min(90vh, 600px)'
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
