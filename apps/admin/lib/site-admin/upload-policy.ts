const maxAttachmentSizeBytes = 30 * 1024 * 1024;
const maxBodyImageSizeBytes = 10 * 1024 * 1024;
const attachmentExtensions = new Set(["pdf", "hwp", "hwpx", "doc", "docx", "xls", "xlsx", "ppt", "pptx"]);
const imageExtensions = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

const attachmentContentTypes = [
  "application/pdf",
  "application/haansofthwp",
  "application/haansoft-hwp",
  "application/haansofthwpx",
  "application/haansoft-hwpx",
  "application/x-hwp",
  "application/x-hwpx",
  "application/vnd.hancom.hwp",
  "application/vnd.hancom.hwpx",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/octet-stream"
];

const imageContentTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export type SiteAdminUploadPolicy = {
  allowedContentTypes: string[];
  maximumSizeInBytes: number;
};

export class SiteAdminUploadPolicyError extends Error {
  constructor(message = "허용되지 않는 업로드 경로 또는 파일 형식입니다.") {
    super(message);
    this.name = "SiteAdminUploadPolicyError";
  }
}

export function resolveUploadPolicy(pathname: string): SiteAdminUploadPolicy {
  const extension = pathname.split(".").pop()?.toLowerCase();

  if (pathname.startsWith("site-attachments/") && extension && attachmentExtensions.has(extension)) {
    return {
      allowedContentTypes: attachmentContentTypes,
      maximumSizeInBytes: maxAttachmentSizeBytes
    };
  }

  if (pathname.startsWith("site-body-images/") && extension && imageExtensions.has(extension)) {
    return {
      allowedContentTypes: imageContentTypes,
      maximumSizeInBytes: maxBodyImageSizeBytes
    };
  }

  throw new SiteAdminUploadPolicyError();
}
