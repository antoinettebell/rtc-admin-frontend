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
