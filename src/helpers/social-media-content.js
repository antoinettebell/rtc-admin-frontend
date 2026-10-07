export const formatSocialContentCta = (cta) => {
  const type = typeof cta?.type === "string" ? cta.type : "";
  const text = typeof cta?.text === "string" ? cta.text : "";
  if (type && text) return `${type} — ${text}`;
  return type || text || "—";
};
