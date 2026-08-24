export const normalizeEventVendorNeedsForPayload = (needs = []) =>
  (Array.isArray(needs) ? needs : []).map((need = {}) => ({
    vendor_type: need.vendor_type,
    type_description: need.type_description || null,
    quantity: Number(need.quantity),
    fee: Number(need.fee),
  }));
