export const formatSocialContentCta = (cta) => {
  const type = typeof cta?.type === "string" ? cta.type : "";
  const text = typeof cta?.text === "string" ? cta.text : "";
  if (type && text) return `${type} — ${text}`;
  return type || text || "—";
};

const persistedText = (value) => typeof value === "string" && value.trim() ? value : "—";

export const formatSocialContentCreative = (creative) => {
  const required = creative?.required === true;
  const direction = persistedText(creative?.direction);
  return {
    required: required ? "Yes" : "No",
    type: persistedText(creative?.type),
    direction,
    source: persistedText(creative?.source),
    assetUrl: persistedText(creative?.assetUrl),
    altText: persistedText(creative?.altText),
    missingRequiredDirection: required && direction === "—",
  };
};

export const socialContentCanApprove = (record) => record?.lifecycleStatus === "READY_FOR_APPROVAL" &&
  record?.verificationComplete === true &&
  (record?.contentPackage?.creative?.required !== true ||
    (record?.creativeProduction?.status === "READY" && Boolean(record?.creativeProduction?.finalAssetKey)));

export const socialContentVisibleInReview = (record) => record?.lifecycleStatus !== "REJECTED";

export const socialContentCreativeProductionIsActive = (record) =>
  record?.lifecycleStatus === "CREATIVE_PRODUCTION" &&
  ["QUEUED", "RENDERING"].includes(record?.creativeProduction?.status);

export const socialContentCanReject = (record) =>
  record?.lifecycleStatus === "READY_FOR_APPROVAL" ||
  record?.lifecycleStatus === "VERIFICATION_REQUIRED" ||
  (record?.lifecycleStatus === "CREATIVE_PRODUCTION" && record?.creativeProduction?.status === "FAILED");

export const socialContentCanRegenerate = (record) => record?.brandCode === "RTC" &&
  (record?.creativeProduction?.status === "FAILED" || socialContentCanApprove(record));

export const socialContentActionsDisabled = (record, busyId = null) =>
  socialContentCreativeProductionIsActive(record) || busyId === record?.contentId;

export const socialContentStatusLabel = (record) => {
  if (record?.lifecycleStatus === "CREATIVE_PRODUCTION") {
    if (record?.creativeProduction?.status === "FAILED") return "Needs Attention";
    if (record?.creativeProduction?.status === "QUEUED") return "Preparing Final Preview";
    if (record?.creativeProduction?.status === "RENDERING") return "Creating Final Preview";
  }
  return ({
    DRAFT: "Draft",
    CREATIVE_PRODUCTION: "Creating Final Preview",
    VERIFICATION_REQUIRED: "Verification Required",
    READY_FOR_APPROVAL: "Pending Approval",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    SCHEDULED: "Scheduled",
    PUBLISHED: "Published",
    FAILED: "Needs Attention",
  })[record?.lifecycleStatus] || String(record?.lifecycleStatus || "Unknown");
};

export const socialContentSafeFailureCode = (error) => {
  const code = error?.response?.data?.data?.error?.code;
  return typeof code === "string" && /^(?:SMA|OPENAI)_[A-Z0-9_]{1,94}$/.test(code) ? code : null;
};
