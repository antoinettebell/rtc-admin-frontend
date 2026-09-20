export const REASON_LABELS = Object.freeze({
  NEW_SPOTLIGHT: "New Spotlight",
  SCHEDULE_CHANGE: "Schedule Updated",
  CONTENT_CHANGE: "Vendor Content Changed",
  MONTHLY_REFRESH: "Monthly Refresh",
  MANUAL_REGENERATION: "Regenerated",
});

export const initialCampaignApprovalUiState = () => ({
  pendingOpen: true,
  approvedOpen: false,
  previewCampaignId: null,
  detailsCampaignId: null,
});

export const reasonLabel = (reason) => REASON_LABELS[reason] || String(reason || "Unknown");

export const campaignTypeLabel = (value) => String(value || "Campaign")
  .toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");

export const emptyCampaignMessage = (section) => section === "approved"
  ? "No approved campaigns yet."
  : "No campaigns are waiting for approval.";

export const campaignApprovalEndpoints = Object.freeze({
  pending: "/api/v1/marketing/campaigns/pending",
  approved: "/api/v1/marketing/campaigns/approved",
  details: (campaignId) => `/api/v1/marketing/campaigns/${encodeURIComponent(campaignId)}`,
  approve: (campaignId) => `/api/v1/marketing/campaigns/${encodeURIComponent(campaignId)}/approve`,
  regenerate: (campaignId) => `/api/v1/marketing/campaigns/${encodeURIComponent(campaignId)}/regenerate`,
});

export const replaceCampaign = (campaigns, campaign) => {
  const index = campaigns.findIndex((item) => item.campaignId === campaign.campaignId);
  if (index < 0) return [campaign, ...campaigns];
  const next = [...campaigns];
  next[index] = { ...next[index], ...campaign };
  return next;
};

export const approveCampaignState = (pending, approved, campaign) => ({
  pending: pending.filter((item) => item.campaignId !== campaign.campaignId),
  approved: replaceCampaign(approved, campaign).sort((left, right) =>
    String(right.approvedAt || right.updatedAt).localeCompare(String(left.approvedAt || left.updatedAt))),
});

export const preserveUsableRendition = (current, replacement) => ({
  ...current,
  ...replacement,
  videoUrl: replacement?.videoUrl || current?.videoUrl || null,
});

export const campaignActionsDisabled = (campaign, busyCampaignId = null) =>
  campaign?.generationStatus === "PROCESSING" || busyCampaignId === campaign?.campaignId;

export const reduceCampaignApprovalUi = (state, action) => {
  switch (action.type) {
    case "TOGGLE_PENDING": return { ...state, pendingOpen: !state.pendingOpen };
    case "TOGGLE_APPROVED": return { ...state, approvedOpen: !state.approvedOpen };
    case "OPEN_PREVIEW": return { ...state, previewCampaignId: action.campaignId };
    case "CLOSE_PREVIEW": return { ...state, previewCampaignId: null };
    case "OPEN_DETAILS": return { ...state, detailsCampaignId: action.campaignId };
    case "CLOSE_DETAILS": return { ...state, detailsCampaignId: null };
    default: return state;
  }
};
