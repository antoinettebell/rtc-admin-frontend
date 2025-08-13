import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function LoadingButton({
  variant,
  disabled,
  className = "",
  size = "default",
  isLoading = false,
  asChild = false,
  type = "button",
  ...props
}: any) {
  return (
    <Button
      className={className}
      variant={variant}
      size={size}
      asChild={asChild}
      disabled={disabled}
      type={type}
    >
      {isLoading && <Loader2 className="animate-spin" />}
      <div {...props}></div>
    </Button>
  );
}
