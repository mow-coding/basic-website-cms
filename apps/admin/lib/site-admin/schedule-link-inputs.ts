export type ScheduleLinkFieldValidation = {
  error: string;
  normalizedValue: string | null;
};

export const scheduleApplicationFormUrlPlaceholder = "신청 form URL을 붙여넣으세요";
export const scheduleNoticePostIdPlaceholder = "공지글 URL 또는 ID를 붙여넣으세요";

const noticePostIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateScheduleApplicationFormUrlInput(value: string): ScheduleLinkFieldValidation {
  const trimmed = value.trim();
  if (!trimmed) {
    return { error: "", normalizedValue: null };
  }

  try {
    const url = new URL(getHttpUrlCandidate(trimmed));
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return {
        error: "http 또는 https로 시작하는 설문 링크를 입력해 주세요.",
        normalizedValue: null
      };
    }

    return { error: "", normalizedValue: url.toString() };
  } catch {
    return {
      error: "https://forms.gle/... 또는 https://example.com/form 형식으로 입력해 주세요.",
      normalizedValue: null
    };
  }
}

export function normalizeScheduleApplicationFormUrlInput(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const validation = validateScheduleApplicationFormUrlInput(value);
  if (validation.error) {
    throw new Error(validation.error);
  }

  return validation.normalizedValue;
}

export function validateScheduleNoticePostFieldInput(value: string): ScheduleLinkFieldValidation {
  const normalizedValue = normalizeScheduleNoticePostIdInput(value);
  if (!value.trim() || normalizedValue) {
    return { error: "", normalizedValue };
  }

  return {
    error: "공지글 URL의 notice 값 또는 게시물 ID를 입력해 주세요.",
    normalizedValue: null
  };
}

export function normalizeScheduleNoticePostIdInput(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  let candidate = trimmed;
  try {
    const url = new URL(trimmed);
    candidate = url.searchParams.get("notice")?.trim() || "";
  } catch {
    const noticeMatch = trimmed.match(/[?&]notice=([^&\s)\]]+)/);
    candidate = noticeMatch?.[1] ? decodeURIComponent(noticeMatch[1]).trim() : trimmed;
  }

  return noticePostIdPattern.test(candidate) ? candidate.toLowerCase() : null;
}

function getHttpUrlCandidate(value: string) {
  const markdownUrlMatch = value.match(/\((https?:\/\/[^)]+)\)/i);
  if (markdownUrlMatch?.[1]) {
    return markdownUrlMatch[1];
  }

  const directUrlMatch = value.match(/https?:\/\/[^\s)\]]+/i);
  if (directUrlMatch?.[0]) {
    return directUrlMatch[0];
  }

  if (/^([a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?([/?#].*)?$/i.test(value)) {
    return `https://${value}`;
  }

  return value;
}
