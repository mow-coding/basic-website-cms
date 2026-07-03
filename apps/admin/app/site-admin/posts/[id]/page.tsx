import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { updateSitePostAction } from "@/app/site-admin/actions";
import { ModalSaveComplete } from "@/app/site-admin/posts/[id]/modal-save-complete";
import { PostFormFields } from "@/app/site-admin/post-form-fields";
import { SiteAdminAutocompleteGuard } from "@/app/site-admin/site-admin-autocomplete-guard";
import { db } from "@/lib/db";
import { resolveSiteAdminAccess } from "@/lib/site-admin/access";

type SitePostEditPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    modal?: string;
    saved?: string;
  }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SitePostEditPage({ params, searchParams }: SitePostEditPageProps) {
  const access = await loadSiteAdminAccess();
  if (!access) {
    redirect("/signin");
  }

  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const post = await loadEditableSitePost(id);

  if (!post) {
    notFound();
  }

  if (!access.canManageSystemSettings && post.authorUserId !== access.appUserId) {
    redirect("/site-admin?section=manage-posts&error=post-permission");
  }

  if (resolvedSearchParams?.modal === "1") {
    if (resolvedSearchParams.saved === "1") {
      return <ModalSaveComplete />;
    }

    return (
      <main className="admin-edit-modal-document" id="main-content">
        <SiteAdminAutocompleteGuard />
        <PostEditForm isModal post={post} />
      </main>
    );
  }

  return (
    <main className="page-shell admin-editor-shell" id="main-content">
      <SiteAdminAutocompleteGuard />
      <header className="heading-row admin-editor-heading">
        <div>
          <h1 className="page-title">게시물 수정</h1>
          <p className="page-subtitle">기존 게시물의 공개 위치, 본문, 첨부 자료를 수정합니다.</p>
        </div>
        <Link className="button-secondary" href="/site-admin?section=manage-posts">
          게시물 목록
        </Link>
      </header>

      <PostEditForm post={post} />
    </main>
  );
}

function PostEditForm({
  isModal = false,
  post
}: {
  isModal?: boolean;
  post: NonNullable<Awaited<ReturnType<typeof loadEditableSitePost>>>;
}) {
  const formId = `site-post-edit-form-${post.id}`;

  return (
    <form autoComplete="off" className="admin-editor-form" action={updateSitePostAction} id={formId}>
      <PostFormFields
        attachmentsDefaultValue={jsonLinksToTextarea(post.attachments)}
        bodyDefaultValue={post.body}
        categoryDefaultValue={post.category}
        formId={formId}
        hiddenFields={
          <>
            <input type="hidden" name="id" value={post.id} />
            {isModal ? <input type="hidden" name="returnMode" value="modal" /> : null}
          </>
        }
        labelsDefaultValue={post.labels}
        relatedLinksDefaultValue={jsonLinksToTextarea(post.relatedLinks)}
        submitLabel="수정 저장"
        titleDefaultValue={post.title}
        visibilityDefaultValue={post.visibility}
      />
    </form>
  );
}

async function loadSiteAdminAccess() {
  try {
    return await resolveSiteAdminAccess();
  } catch (error) {
    logSitePostEditPageError("access", error);
    throw error;
  }
}

async function loadEditableSitePost(id: string) {
  try {
    return await db.sitePost.findFirst({
      where: {
        id,
        deletedAt: null
      }
    });
  } catch (error) {
    logSitePostEditPageError("post", error, { postId: id });
    throw error;
  }
}

function logSitePostEditPageError(stage: "access" | "post", error: unknown, context: Record<string, string> = {}) {
  console.error("[site-admin/posts] page load failed", {
    stage,
    ...context,
    ...serializeSitePostEditError(error)
  });
}

function serializeSitePostEditError(error: unknown) {
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

function jsonLinksToTextarea(value: unknown) {
  if (!Array.isArray(value)) {
    return "";
  }

  return value
    .map((item) => {
      if (!isLinkItem(item)) {
        return "";
      }

      return `${item.title} | ${item.url}`;
    })
    .filter(Boolean)
    .join("\n");
}

function isLinkItem(value: unknown): value is { title: string; url: string } {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as { title?: unknown; url?: unknown };
  return typeof candidate.title === "string" && typeof candidate.url === "string";
}
