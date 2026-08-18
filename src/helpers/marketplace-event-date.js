const ISO_CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})(?:T|$)/;

const getZonedCalendarParts = (value, timeZone = "America/New_York") => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  try {
    return Object.fromEntries(
      new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
        .formatToParts(date)
        .filter(({ type }) => type !== "literal")
        .map(({ type, value: partValue }) => [type, partValue]),
    );
  } catch (_error) {
    return null;
  }
};

export const normalizeMarketplaceCalendarDateInput = (value) => {
  if (!value) return "";
  const source = value instanceof Date ? value.toISOString() : String(value);
  const match = source.match(ISO_CALENDAR_DATE);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : "";
};

export const normalizeMarketplaceZonedDateInput = (
  value,
  timeZone = "America/New_York",
) => {
  if (!value) return "";
  const legacyCalendarDate = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (legacyCalendarDate) return legacyCalendarDate[0];
  const parts = getZonedCalendarParts(value, timeZone);
  return parts ? `${parts.year}-${parts.month}-${parts.day}` : "";
};

export const formatMarketplaceCalendarDate = (value) => {
  const normalized = normalizeMarketplaceCalendarDateInput(value);
  if (!normalized) return "-";
  const [year, month, day] = normalized.split("-");
  return `${month}/${day}/${year}`;
};
