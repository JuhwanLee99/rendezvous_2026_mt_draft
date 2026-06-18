const GAME_DATE_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2})?$/;
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function normalizeGameDateTime(value) {
  const match = String(value || "").trim().match(GAME_DATE_TIME_PATTERN);
  if (!match) return "";

  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const date = new Date(year, month - 1, day, hour, minute);
  const valid = date.getFullYear() === year
    && date.getMonth() === month - 1
    && date.getDate() === day
    && date.getHours() === hour
    && date.getMinutes() === minute;

  return valid ? `${yearText}-${monthText}-${dayText}T${hourText}:${minuteText}` : "";
}

export function formatGameDateTime(value) {
  const normalized = normalizeGameDateTime(value);
  if (!normalized) return "";

  const [datePart, timePart] = normalized.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  const weekday = WEEKDAYS[new Date(year, month - 1, day).getDay()];
  const period = hour < 12 ? "오전" : "오후";
  const displayHour = hour % 12 || 12;

  return `${year}. ${month}. ${day}. (${weekday}) ${period} ${displayHour}:${String(minute).padStart(2, "0")}`;
}
