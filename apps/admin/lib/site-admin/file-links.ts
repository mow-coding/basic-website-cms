export function isPrivateBlobUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".private.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

export function getAdminFileHref(value: string, origin?: string) {
  if (!isPrivateBlobUrl(value)) return value;
  const path = `/api/site-admin/files?${new URLSearchParams({ url: value })}`;
  return origin ? new URL(path, origin).toString() : path;
}
