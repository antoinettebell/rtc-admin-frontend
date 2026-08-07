import type { MarketplacePaymentResponsibility } from "../services/marketplace-api-service";

export function getDerivedPaymentResponsibility(event?: {
  fully_catered_event?: boolean;
  catered_vip_section_enabled?: boolean;
  ga_food_sales_allowed?: boolean | null;
}): MarketplacePaymentResponsibility;

export function getMarketplacePaymentVisibility(event?: Parameters<typeof getDerivedPaymentResponsibility>[0]): {
  responsibility: MarketplacePaymentResponsibility;
  showVendorFee: boolean;
  showBudget: boolean;
  showPaymentDeadline: boolean;
};
