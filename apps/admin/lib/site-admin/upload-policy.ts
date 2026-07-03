const maxAttachmentSizeBytes = 30 * 1024 * 1024;
const maxBodyImageSizeBytes = 10 * 1024 * 1024;
const attachmentExtensions = new Set(["pdf", "hwp", "hwpx", "doc", "docx", "xls", "xlsx", "ppt", "pptx"]);
const imageExtensions = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

const hwpContentTypes = [
  "application/haansofthwp",
  "application/haansoft-hwp",
  "application/haansofthwpx",
  "application/haansoft-hwpx",
  "application/x-hwp",
  "application/x-hwpx",
  "application/vnd.hancom.hwp",
  "application/vnd.hancom.hwpx",
  "application/octet-stream"
];

// 확장자별로 허용 content-type을 제한해, 예컨대 .pdf 업로드에는 application/pdf만 통과시킵니다.
const attachmentContentTypesByExtension: Record<string, string[]> = {
  doc: ["application/msword"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  hwp: hwpContentTypes,
  hwpx: hwpContentTypes,
  pdf: ["application/pdf"],
  ppt: ["application/vnd.ms-powerpoint"],
  pptx: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  xls: ["application/vnd.ms-excel"],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]
};

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
      allowedContentTypes: attachmentContentTypesByExtension[extension] ?? [],
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
