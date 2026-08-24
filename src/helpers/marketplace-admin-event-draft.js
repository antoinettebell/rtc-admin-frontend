/**
 * Retained admin drafts are intentionally allowed to restore unfinished event
 * changes. The payment deadline is different: after marketplace activity, the
 * backend locks its exact timestamp. Older drafts stored only a calendar date,
 * so restoring that value would silently turn the canonical deadline into
 * midnight and make an unrelated publish fail.
 */
export const mergeMarketplaceEventWithAdminDraft = (event, draft = {}) => ({
  ...event,
  ...draft,
  vendor_fee_payment_deadline: event.vendor_fee_payment_deadline ?? null,
});
