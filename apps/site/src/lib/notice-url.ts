export const noticeQueryParam = "notice";

// Shared by every notice list (notice-browser, home preview, workshop list/overview):
// reflect the open notice in the URL (?notice=<id>) without a full navigation.
export function updateNoticeUrl(noticeId: string | null, mode: "push" | "replace") {
  const url = new URL(window.location.href);

  if (noticeId) {
    url.searchParams.set(noticeQueryParam, noticeId);
  } else {
    url.searchParams.delete(noticeQueryParam);
  }

  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (nextUrl === currentUrl) {
    return;
  }

  if (mode === "push") {
    window.history.pushState({}, "", nextUrl);
  } else {
    window.history.replaceState({}, "", nextUrl);
  }
}
