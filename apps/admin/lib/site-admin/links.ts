export type LinkItem = {
  title: string;
  url: string;
};

export function parseLinkLines(value: string | null, limit: number): LinkItem[] {
  if (!value) {
    return [];
  }

  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, limit)
    .map((line) => {
      const separatorIndex = line.lastIndexOf("|");
      const [title, url] = separatorIndex >= 0
        ? [line.slice(0, separatorIndex), line.slice(separatorIndex + 1)]
        : [line, line];
      try {
        return {
          title: title.trim(),
          url: normalizeHttpUrl(url.trim(), "link")
        };
      } catch {
        return null;
      }
    })
    .filter((item): item is LinkItem => Boolean(item && item.title && item.url));
}

export function normalizeHttpUrl(value: string, key: string) {
  const candidate = getHttpUrlCandidate(value.trim());

  try {
    const url = new URL(candidate);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
  } catch {
    // Fall through to the shared validation error below.
  }

  throw new Error(`Invalid URL field: ${key}`);
}

function getHttpUrlCandidate(value: string) {
  if (!value) {
    return value;
  }

  if (/^https?:\/\//i.test(value) || /^[a-z][a-z0-9+.-]*:/i.test(value)) {
    return value;
  }

  if (/^([a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?([/?#].*)?$/i.test(value)) {
    return `https://${value}`;
  }

  return value;
}
