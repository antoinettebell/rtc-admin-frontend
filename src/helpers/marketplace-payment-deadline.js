const normalizeTime = (value = "") => {
  const match = String(value).trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return "";
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return "";
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

export const formatMarketplacePaymentDeadlineTimeInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

export const buildMarketplacePaymentDeadline = ({
  date,
  time,
  original,
  originalDate,
  originalTime,
} = {}) => {
  if (!date) return null;
  if (original && date === originalDate && normalizeTime(time) === normalizeTime(originalTime)) {
    return original;
  }
  const [year, month, day] = String(date).split("-").map(Number);
  const [hours, minutes] = normalizeTime(time).split(":").map(Number);
  if (!year || !month || !day || !Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  return new Date(year, month - 1, day, hours, minutes, 0, 0).toISOString();
};
