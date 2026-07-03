const seoulTimeZone = "Asia/Seoul";

const seoulDateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: seoulTimeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23"
});

type SeoulDateTimeParts = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
};

export function formatSeoulDateTime(value: Date, options: { timeZoneLabel?: boolean } = {}) {
  const parts = getSeoulDateTimeParts(value);
  const formatted = `${parts.year}.${parts.month}.${parts.day} ${parts.hour}:${parts.minute}`;
  return options.timeZoneLabel ? `${formatted} KST` : formatted;
}

export function formatSeoulCompactDateTime(value: Date) {
  const parts = getSeoulDateTimeParts(value);
  return `${parts.year.slice(-2)}${parts.month}${parts.day} ${parts.hour}:${parts.minute}`;
}

export function formatSeoulDateTimeInput(value: Date | null | undefined) {
  if (!value) {
    return "";
  }

  const parts = getSeoulDateTimeParts(value);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function getSeoulYear(value: Date) {
  return Number(getSeoulDateTimeParts(value).year);
}

export function parseSeoulDateTimeInput(value: string, key: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!match) {
    throw new Error(`Invalid date field: ${key}`);
  }

  const [, yearText, monthText, dayText, hourText, minuteText, secondText = "00"] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const date = new Date(Date.UTC(year, month - 1, day, hour - 9, minute, second));
  const seoulParts = getSeoulDateTimeParts(date);

  if (
    Number.isNaN(date.getTime()) ||
    seoulParts.year !== yearText ||
    seoulParts.month !== monthText ||
    seoulParts.day !== dayText ||
    seoulParts.hour !== hourText ||
    seoulParts.minute !== minuteText
  ) {
    throw new Error(`Invalid date field: ${key}`);
  }

  return date;
}

function getSeoulDateTimeParts(value: Date): SeoulDateTimeParts {
  const parts = Object.fromEntries(
    seoulDateTimeFormatter
      .formatToParts(value)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return {
    year: parts.year ?? "0000",
    month: parts.month ?? "01",
    day: parts.day ?? "01",
    hour: parts.hour ?? "00",
    minute: parts.minute ?? "00"
  };
}
