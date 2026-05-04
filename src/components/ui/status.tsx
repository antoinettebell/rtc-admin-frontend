import { useEffect, useState } from "react";
import { Ban, Clock3, UserRoundCheck } from "lucide-react";

export const Status = ({
  status,
  className,
}: {
  status:
    | "ACTIVE"
    | "INACTIVE"
    | "INVITED"
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | string
    | undefined;
  className?: string;
}) => {
  const bg: Record<string, string> = {
    ACTIVE: "bg-[#05CD9933]",
    APPROVED: "bg-[#05CD9933]",
    INACTIVE: "bg-[#EE5D5033]",
    REJECTED: "bg-[#EE5D5033]",
    PENDING: "bg-[#FFB54733]",
    INVITED: "bg-[#FFB54733]",
  };
  const color: Record<string, string> = {
    ACTIVE: "text-[#05CD99]",
    APPROVED: "text-[#05CD99]",
    INACTIVE: "text-[#EE5D50]",
    REJECTED: "text-[#EE5D50]",
    PENDING: "text-[#FFB547]",
    INVITED: "text-[#FFB547]",
  };
  const icon: Record<string, any> = {
    ACTIVE: UserRoundCheck,
    APPROVED: UserRoundCheck,
    INACTIVE: Ban,
    REJECTED: Ban,
    PENDING: Clock3,
    INVITED: Clock3,
  };
  const text: Record<string, string> = {
    ACTIVE: "Active",
    APPROVED: "Approved",
    INACTIVE: "Inactive",
    REJECTED: "Rejected",
    PENDING: "Pending",
    INVITED: "Invited",
  };
  const [details, setDetails] = useState({
    bg: bg["ACTIVE"],
    color: color["ACTIVE"],
    icon: icon["ACTIVE"],
    text: text["ACTIVE"],
  });
  useEffect(() => {
    if (!status) return;
    setDetails({
      bg: bg[status.toUpperCase()],
      color: color[status.toUpperCase()],
      icon: icon[status.toUpperCase()],
      text: text[status.toUpperCase()],
    });
  }, []);
  return (
    <div
      className={`p-2.5 flex gap-1 rounded-md w-fit min-w-[95px] items-center ${details.bg} ${className}`}
    >
      {details.icon && (
        <details.icon size="16" className={details.color}></details.icon>
      )}
      <div className={`${details.color} text-sm`}>{details.text}</div>
    </div>
  );
};
