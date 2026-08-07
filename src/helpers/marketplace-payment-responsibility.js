export const getDerivedPaymentResponsibility = (event = {}) =>
  event.fully_catered_event
    ? "COORDINATOR"
    : event.catered_vip_section_enabled
      ? event.ga_food_sales_allowed
        ? "BOTH"
        : "COORDINATOR"
      : "VENDOR";

export const getMarketplacePaymentVisibility = (event = {}) => {
  const responsibility = getDerivedPaymentResponsibility(event);
  return {
    responsibility,
    showVendorFee: ["VENDOR", "BOTH"].includes(responsibility),
    showBudget: ["COORDINATOR", "BOTH"].includes(responsibility),
    showPaymentDeadline: ["VENDOR", "BOTH"].includes(responsibility),
  };
};
