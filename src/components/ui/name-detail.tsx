import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StringHelper } from "@/models/string-helper-model";

export const NameDetail = ({
  imgSrc,
  name,
  email,
  contact,
  avatarClassName,
}: {
  imgSrc?: string | null;
  name: string;
  email: string;
  contact: string;
  avatarClassName: string;
}) => {
  return (
    <div className="flex gap-2.5 px-1.5 items-center h-[64px]">
      <Avatar className="h-10 w-10 rounded-lg border border-[#D9D9D9]">
        <AvatarImage
          className={`rounded-lg ${avatarClassName || ""}`}
          src={imgSrc || ""}
          alt={name || ""}
        />
        <AvatarFallback className="rounded-lg">
          {StringHelper.getInitials(name || "")}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-1 text-[#181818] leading-[18px]">
        <div className="text-sm font-semibold">{name || "-"}</div>
        <div className="text-sm">{email || "-"}</div>
        {/*<div className="text-sm">{contact || "-"}</div>*/}
      </div>
    </div>
  );
};
