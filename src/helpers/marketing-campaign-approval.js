export const REASON_LABELS = Object.freeze({
  NEW_SPOTLIGHT: "New Spotlight",
  SCHEDULE_CHANGE: "Schedule Updated",
  CONTENT_CHANGE: "Vendor Content Changed",
  MONTHLY_REFRESH: "Monthly Refresh",
  MANUAL_GENERATION: "Manual Generation",
  MANUAL_REGENERATION: "Regenerated",
  INITIAL_GENERATION: "Initial Generation",
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
  eligibleVendors: "/api/v1/marketing/campaigns/eligible-vendors",
  eligibleAppFeatures: "/api/v1/marketing/campaigns/eligible-app-features",
  eligibleEvents: "/api/v1/marketing/campaigns/eligible-events",
  generate: "/api/v1/marketing/campaigns/generate",
  generateAppFeatures: "/api/v1/marketing/campaigns/generate-app-features",
  generateEvents: "/api/v1/marketing/campaigns/generate-events",
  details: (campaignId) => `/api/v1/marketing/campaigns/${encodeURIComponent(campaignId)}`,
  approve: (campaignId) => `/api/v1/marketing/campaigns/${encodeURIComponent(campaignId)}/approve`,
  regenerate: (campaignId) => `/api/v1/marketing/campaigns/${encodeURIComponent(campaignId)}/regenerate`,
});

export const campaignVideoDownloadName = (campaign) => {
  const business = String(campaign?.businessName || "vendor-spotlight")
    .trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const id = String(campaign?.campaignId || "video").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 12);
  return `${business || "vendor-spotlight"}-${id || "video"}.mp4`;
};

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

export const ACTIVE_REGENERATION_STATUSES = Object.freeze([
  "QUEUED",
  "PROCESSING",
  "WAITING_FOR_RENDER",
]);

export const campaignRegenerationIsActive = (campaign) =>
  ACTIVE_REGENERATION_STATUSES.includes(campaign?.regenerationStatus) ||
  campaign?.generationStatus === "PROCESSING";

export const campaignStatusLabel = (campaign) => {
  switch (campaign?.regenerationStatus) {
    case "QUEUED": return "Queued";
    case "PROCESSING": return "Generating";
    case "WAITING_FOR_RENDER": return "Rendering";
    case "READY_FOR_APPROVAL": return "Ready for Approval";
    case "FAILED": return "Failed";
    case "TIMED_OUT": return "Timed Out";
    case "DEAD_LETTERED": return "Needs Attention";
    default:
      if (campaign?.generationStatus === "PROCESSING") return "Generating";
      if (campaign?.generationStatus === "COMPLETED") return "Ready for Approval";
      if (campaign?.generationStatus === "FAILED") return "Failed";
      return String(campaign?.generationStatus || "Unknown");
  }
};

export const campaignStatusIsFailure = (campaign) =>
  ["FAILED", "TIMED_OUT", "DEAD_LETTERED"].includes(campaign?.regenerationStatus) ||
  campaign?.generationStatus === "FAILED";

export const campaignCanApprove = (campaign) =>
  campaign?.generationStatus === "COMPLETED" &&
  !campaignRegenerationIsActive(campaign) &&
  !campaignStatusIsFailure(campaign) &&
  Boolean(campaign?.videoUrl);

export const campaignActionsDisabled = (campaign, busyCampaignId = null) =>
  campaignRegenerationIsActive(campaign) || busyCampaignId === campaign?.campaignId;

export const toggleVendorSelection = (current, vendorId, checked) => checked
  ? [...new Set([...current, vendorId])]
  : current.filter((value) => value !== vendorId);

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
