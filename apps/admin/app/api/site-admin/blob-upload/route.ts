import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { resolveSiteAdminAccess } from "@/lib/site-admin/access";
import { resolveUploadPolicy, SiteAdminUploadPolicyError } from "@/lib/site-admin/upload-policy";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HandleUploadBody;
    const blobToken = env.BLOB_READ_WRITE_TOKEN?.trim();
    if (!blobToken) {
      throw new Error("Vercel Blob upload token is not configured.");
    }

    const response = await handleUpload({
      body,
      request,
      token: blobToken,
      onBeforeGenerateToken: async (pathname) => {
        const access = await resolveSiteAdminAccess();
        if (!access) {
          throw new PublicUploadError("로그인이 필요한 업로드입니다. 다시 로그인한 뒤 파일을 첨부해 주세요.");
        }

        const uploadPolicy = resolveUploadPolicy(pathname);

        return {
          allowedContentTypes: uploadPolicy.allowedContentTypes,
          maximumSizeInBytes: uploadPolicy.maximumSizeInBytes,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            userId: access.appUserId
          })
        };
      },
      onUploadCompleted: async () => {
        // The post form stores the returned Blob URL after the browser upload completes.
      }
    });

    return NextResponse.json(response);
  } catch (error) {
    logUploadError(error);

    return NextResponse.json(
      { error: getSafeUploadErrorMessage(error) },
      { status: 400 }
    );
  }
}

class PublicUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublicUploadError";
  }
}

function getSafeUploadErrorMessage(error: unknown) {
  if (error instanceof PublicUploadError || error instanceof SiteAdminUploadPolicyError) {
    return error.message;
  }

  return "첨부 파일 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}

function logUploadError(error: unknown) {
  console.error("[site-admin] upload failed", {
    action: "blob-upload",
    stage: "site-admin-upload",
    ...serializeUploadError(error)
  });
}

function serializeUploadError(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack
    };
  }

  return {
    message: String(error),
    name: typeof error
  };
}
