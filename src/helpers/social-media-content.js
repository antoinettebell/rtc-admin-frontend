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
  ["CREATIVE_PRODUCTION", "VERIFICATION_REQUIRED", "READY_FOR_APPROVAL"].includes(record?.lifecycleStatus);
