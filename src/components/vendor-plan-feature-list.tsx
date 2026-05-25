import { Check, X } from "lucide-react";

type VendorPlan = {
  name?: string;
  slug?: string;
  rate?: number | string;
  capabilities?: Record<string, any>;
};

const getTierKey = (plan?: VendorPlan) => {
  const slug = String(plan?.slug || "").toUpperCase();
  const name = String(plan?.name || "").toUpperCase();
  const rate = Number(plan?.rate);

  if (slug.includes("ELITE") || name.includes("ELITE") || rate === 5.5) {
    return "ELITE";
  }
  if (
    slug.includes("PLATINUM") ||
    name.includes("PLATINUM") ||
    rate === 4.5
  ) {
    return "PLATINUM";
  }
  return "BASIC";
};

const getCapabilities = (plan?: VendorPlan) => {
  const tier = getTierKey(plan);
  const fallback = {
    BASIC: {
      deliveryAcceptance: true,
      marketplaceOrdering: true,
      preorderOrdering: true,
      qrOrdering: true,
      printing: true,
      employeeLogin: false,
      employeeWalkUpPos: false,
      cashPos: false,
      tapToPay: false,
      eventMarketplace: false,
      newDishHighlight: false,
      reporting: "Basic reporting",
      payout: "3-day payouts",
      mediaLinks: "1 media/social link",
    },
    PLATINUM: {
      deliveryAcceptance: true,
      marketplaceOrdering: true,
      preorderOrdering: true,
      qrOrdering: true,
      printing: true,
      employeeLogin: true,
      employeeWalkUpPos: true,
      cashPos: true,
      tapToPay: false,
      eventMarketplace: false,
      newDishHighlight: false,
      reporting: "Advanced reporting",
      payout: "2-day payouts",
      mediaLinks: "2 media/social links",
    },
    ELITE: {
      deliveryAcceptance: true,
      marketplaceOrdering: true,
      preorderOrdering: true,
      qrOrdering: true,
      printing: true,
      employeeLogin: true,
      employeeWalkUpPos: true,
      cashPos: true,
      tapToPay: true,
      eventMarketplace: true,
      newDishHighlight: true,
      reporting: "Customizable reporting",
      payout: "Daily payouts",
      mediaLinks: "4 media/social links",
    },
  }[tier];

  const capabilities = plan?.capabilities || {};
  return {
    ...fallback,
    deliveryAcceptance:
      capabilities.deliveryAcceptance ?? fallback.deliveryAcceptance,
    employeeLogin: capabilities.employeeLogin ?? fallback.employeeLogin,
    employeeWalkUpPos:
      capabilities.employeeWalkUpPos ?? fallback.employeeWalkUpPos,
    cashPos:
      capabilities.cashPos ??
      (capabilities.walkUpPosPaymentMethods || []).includes("CASH") ??
      fallback.cashPos,
    tapToPay: capabilities.tapToPay ?? fallback.tapToPay,
    eventMarketplace:
      capabilities.eventMarketplace ?? fallback.eventMarketplace,
    newDishHighlight:
      capabilities.newDishHighlight ?? fallback.newDishHighlight,
    mediaLinks: capabilities.maxSocialMediaLinks
      ? `${capabilities.maxSocialMediaLinks} media/social links`
      : fallback.mediaLinks,
  };
};

export function VendorPlanFeatureList({ plan }: { plan?: VendorPlan }) {
  const c = getCapabilities(plan);
  const rows = [
    { label: "Marketplace ordering", enabled: c.marketplaceOrdering },
    { label: "Delivery acceptance", enabled: c.deliveryAcceptance },
    { label: "Preorder ordering", enabled: c.preorderOrdering },
    { label: "QR ordering", enabled: c.qrOrdering },
    { label: "Printing", enabled: c.printing },
    { label: c.reporting, enabled: true },
    { label: c.mediaLinks, enabled: true },
    { label: c.payout, enabled: true },
    { label: "Employee Login/Cashier Mode", enabled: c.employeeLogin },
    {
      label: "Walk-up POS for Cash Payments Only",
      enabled: c.employeeWalkUpPos && c.cashPos,
    },
    { label: "Tap to Pay", enabled: c.tapToPay },
    { label: "Ability to highlight dishes", enabled: c.newDishHighlight },
    { label: "Event marketplace", enabled: c.eventMarketplace },
  ];

  return (
    <div className="grid gap-1.5">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-center gap-2 text-sm text-gray-700"
        >
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
              row.enabled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {row.enabled ? <Check size={14} /> : <X size={14} />}
          </span>
          <span>{row.enabled ? row.label : `No ${row.label}`}</span>
        </div>
      ))}
    </div>
  );
}
