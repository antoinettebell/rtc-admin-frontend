import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CustomFileInputProps {
  field: any;
  setFile?: (file: File | null) => void;
  file?: File | null;
  imgSrc?: string;
  className?: string;
  removeImage?: () => void;
  uploadMessage?: string;
  validMimeTypes?: string[];
  mimeValidationMessage?: string;
  maxSizeMB?: number;
  showBrowseButton?: boolean;
  disableDropFile?: boolean;
}

export const FileSelect: React.FC<CustomFileInputProps> = ({
  field,
  imgSrc,
  className,
  uploadMessage,
  file,
  setFile = (file: File | null) => {},
  removeImage = () => {},
  validMimeTypes = ["image/gif", "image/png", "image/jpeg", "image/jpg"],
  mimeValidationMessage = "Invalid file. We support only PNGs, JPEGs, and GIFs.",
  maxSizeMB = 5,
  showBrowseButton = false,
  disableDropFile = false,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [imgUrl, setLocalImgUrl] = useState<string>("");
  const [localFile, setLocalFile] = useState<File[]>([]);

  const imgMims = ["image/gif", "image/png", "image/jpeg", "image/jpg"];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      setLocalFile([]);
      if (!validMimeTypes.includes(file.type.toLowerCase())) {
        toast.error(mimeValidationMessage);
        return;
      }

      // if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
      //   toast.error(
      //     `File upload failed. The maximum allowed file size is ${maxSizeMB}MB.`,
      //   );
      //   return;
      // }

      setFile(file);

      // Read file and set preview URL
      if (!imgMims.includes(file.type.toLowerCase())) return;
      const reader = new FileReader();
      reader.onload = () => {
        setLocalImgUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];

      setLocalFile([]);

      if (!validMimeTypes.includes(file.type.toLowerCase())) {
        toast.error(mimeValidationMessage);
        return;
      }

      // if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
      //   toast.error(
      //     `File upload failed. The maximum allowed file size is ${maxSizeMB}MB.`,
      //   );
      //   return;
      // }

      setFile(file);

      if (!imgMims.includes(file.type.toLowerCase())) return;
      const reader = new FileReader();
      reader.onload = () => {
        setLocalImgUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <>
      {/* Hidden File Input */}
      <input
        {...field}
        ref={inputRef}
        type="file"
        className="hidden"
        value={localFile}
        onChange={handleFileChange}
      />

      {/* Drop Area */}
      <div
        className={`group border border-dashed border-[#d9d9d9] overflow-hidden rounded-xl flex justify-center items-center bg-neutral-50 cursor-pointer relative ${className || ""}`}
        onClick={() => inputRef.current?.click()}
        onDrop={(e) => !disableDropFile && handleDrop(e)}
        onDragOver={(e) => !disableDropFile && handleDragOver(e)}
      >
        {imgUrl || imgSrc ? (
          <>
            <img
              src={imgUrl || imgSrc}
              className="max-w-full max-h-full h-auto absolute"
            />
            <div
              className="group-hover:block hidden absolute top-2.5 right-2.5 p-1.5 border border-[#d9d9d9] rounded-md"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                removeImage();
                setLocalImgUrl("");
              }}
            >
              <Trash2 className="text-[#FF3232]" size="16" />
            </div>
          </>
        ) : (
          <div
            className={`mx-2.5 justify-center flex flex-col items-center ${showBrowseButton ? "my-3" : "my-7"}`}
          >
            <svg
              width="43"
              height="33"
              viewBox="0 0 43 33"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M33.5987 32.1441H26.6488H24.7773H24.3731V22.8219H27.4219C28.1951 22.8219 28.652 21.9432 28.1951 21.3106L22.2644 13.1043C21.8866 12.5771 21.1046 12.5771 20.7268 13.1043L14.7961 21.3106C14.3392 21.9432 14.7873 22.8219 15.5693 22.8219H18.6181V32.1441H18.2139H16.3425H8.28545C3.67266 31.8893 0 27.5752 0 22.9009C0 19.6764 1.74847 16.8648 4.34042 15.3448C4.10319 14.7034 3.98018 14.018 3.98018 13.2976C3.98018 10.0027 6.64242 7.34047 9.93727 7.34047C10.649 7.34047 11.3343 7.46348 11.9757 7.70071C13.8823 3.65902 17.9943 0.856201 22.774 0.856201C28.9595 0.864987 34.0556 5.60079 34.6355 11.637C39.3888 12.4541 43 16.856 43 21.8378C43 27.1623 38.8529 31.7751 33.5987 32.1441Z"
                fill="#18181B"
              />
            </svg>
            <div className="mt-2.5 text-[#71717A] text-xs font-medium text-center leading-4">
              {uploadMessage || "Drag and Drop or click to upload image"}
            </div>
            {showBrowseButton && (
              <>
                <div className="mt-1 text-[#71717A] text-xs font-medium text-center leading-4">
                  Or
                </div>
                <Button
                  variant="outline"
                  className="mt-1 border-[#d9d9d9] text-[#2563EB] hover:text-[#2563EB] text-base font-medium"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    inputRef.current?.click();
                  }}
                >
                  Browse
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export const ReadFileProgressModal = ({
  open,
  onClose,
  percentage,
  message,
  title,
}) => {
  const size = 100;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [progress, setProgress] = useState<number>(1);

  useEffect(() => {
    setProgress(((percentage > 100 ? 96 : percentage) / 100) * circumference);
  }, [percentage]);

  return (
    <Dialog open={open} onOpenChange={(e) => !e && onClose && onClose(false)}>
      <DialogContent className="sm:max-w-[400px] p-6 gap-6" hideCancel={true}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold w-full flex justify-center">
            {title || "Please wait. . ."}
          </DialogTitle>
        </DialogHeader>
        <div className="w-full flex justify-center">
          <div className="relative">
            <svg
              className="animate-spin"
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              key={`svg-load-${progress}`}
            >
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#d9d9d9"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              <circle
                key={`svg-circle-${progress}`}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#2563EB"
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - progress}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                className="transition-all duration-500 ease-in-out"
              />
            </svg>
            <div className="absolute top-0 left-0 w-full h-full text-[#2563EB] text-base flex justify-center items-center font-semibold">
              {percentage > 100 ? 96 : percentage}%
            </div>
          </div>
        </div>
        <div className="w-full flex justify-center">
          {message || "We are retrieving the sheet."}
        </div>
      </DialogContent>
    </Dialog>
  );
};
