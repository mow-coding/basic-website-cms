export type NoticeAttachmentLink = {
  title: string;
  url: string;
};

export function getAttachmentHref(item: NoticeAttachmentLink, postId: string) {
  if (!isVercelBlobAttachmentUrl(item.url)) {
    return item.url;
  }

  const params = new URLSearchParams({
    url: item.url,
    postId
  });

  return `/api/attachments/download?${params.toString()}`;
}

function isVercelBlobAttachmentUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (url.hostname.endsWith(".public.blob.vercel-storage.com") ||
        url.hostname.endsWith(".private.blob.vercel-storage.com")) &&
      url.pathname.startsWith("/site-attachments/")
    );
  } catch {
    return false;
  }
}
