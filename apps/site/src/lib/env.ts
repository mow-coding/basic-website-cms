export const env = {
  SITE_ADMIN_API_URL: process.env.SITE_ADMIN_API_URL?.trim() ?? "",
  SITE_REVALIDATE_SECRET: process.env.SITE_REVALIDATE_SECRET?.trim() ?? "",
  // 설정하면 첨부 다운로드 프록시가 이 정확한 호스트(이 배포의 blob 스토어)만 허용합니다.
  // 비워 두면 vercel blob 스토어 접미사(*.public.blob.vercel-storage.com)로 폴백합니다.
  SITE_ATTACHMENT_BLOB_HOST: process.env.SITE_ATTACHMENT_BLOB_HOST?.trim() ?? ""
};
