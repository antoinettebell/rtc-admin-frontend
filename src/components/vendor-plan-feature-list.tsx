import { Check } from "lucide-react";

type VendorPlan = {
  name?: string;
  slug?: string;
  rate?: number | string;
  details?: string[];
};

type FoodVendorTier = "BASIC" | "PLATINUM" | "ELITE";

export const CANONICAL_FOOD_VENDOR_BENEFITS: Record<FoodVendorTier, readonly string[]> = {
  BASIC: [
    "Delivery/Pickup Ordering Fulfillment",
    "Bluetooth Order/Receipt Printing",
    "Sales Tax Reporting",
    "1 media/social link",
    "3-day payouts",
  ],
  PLATINUM: [
    "Delivery/Pickup Ordering Fulfillment",
    "Bluetooth Order/Receipt Printing",
    "Sales Tax Reporting",
    "1099 Reporting",
    "2 media/social links",
    "2-day payouts",
    "Employee Login/Cashier Mode",
    "Walk-Up Payment Acceptance (Cash Only)",
  ],
  ELITE: [
    "Delivery/Pickup Ordering Fulfillment",
    "Bluetooth Order/Receipt Printing",
    "Sales Tax Reporting",
    "1099 Reporting",
    "4 media/social links",
    "Daily payouts",
    "Employee Login/Cashier Mode",
    "Walk-Up Payment Acceptance (Cash/Tap to Pay)",
    "Multiple food trucks",
    "Event marketplace",
  ],
};

const getFoodVendorTier = (plan?: VendorPlan): FoodVendorTier | null => {
  const slug = String(plan?.slug || "").toUpperCase();
  const name = String(plan?.name || "").toUpperCase();
  const rate = Number(plan?.rate);
  if (slug.includes("ELITE") || name.includes("ELITE") || rate === 5.5) return "ELITE";
  if (slug.includes("PLATINUM") || name.includes("PLATINUM") || rate === 4.5) return "PLATINUM";
  if (slug.includes("BASIC") || name.includes("BASIC") || rate === 3.5) return "BASIC";
  return null;
};

export const getVendorPlanBenefits = (plan?: VendorPlan): readonly string[] => {
  const tier = getFoodVendorTier(plan);
  // Known Food Vendor tiers always render the exact backend contract; legacy
  // stored detail strings cannot alter the Admin display.
  return tier ? CANONICAL_FOOD_VENDOR_BENEFITS[tier] : plan?.details || [];
};

// Kept for the existing Admin employee-tab gate. This is derived from the
// same canonical tier identity rather than from legacy persisted capability
// fields.
export const getVendorPlanCapabilities = (plan?: VendorPlan) => {
  const tier = getFoodVendorTier(plan);
  return {
    employeeLogin: tier === "PLATINUM" || tier === "ELITE",
    employeeWalkUpPos: tier === "PLATINUM" || tier === "ELITE",
    tapToPay: tier === "ELITE",
    multipleTruckUnits: tier === "ELITE",
    eventMarketplace: tier === "ELITE",
  };
};

export function VendorPlanFeatureList({ plan }: { plan?: VendorPlan }) {
  const benefits = getVendorPlanBenefits(plan);
  return (
    <div className="grid gap-1.5">
      {benefits.map((label) => (
        <div key={label} className="flex items-center gap-2 text-sm text-gray-700">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
            <Check size={14} />
          </span>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
