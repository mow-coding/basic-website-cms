import { SiteContentVisibility, SitePostCategory } from "@prisma/client";
import type { ReactNode } from "react";
import { AttachmentUploader } from "@/app/site-admin/attachment-uploader";
import { FormSubmitButton } from "@/app/site-admin/form-submit-button";
import { LinkListInput } from "@/app/site-admin/link-list-input";
import { PostCategoryWorkshopFields } from "@/app/site-admin/post-category-workshop-fields";
import { RichTextEditor } from "@/app/site-admin/rich-text-editor";
import { UnsavedEditorGuard } from "@/app/site-admin/unsaved-editor-guard";
import {
  relatedWorkshopEnabledCategories,
  selectableSitePostCategories,
  selectableSiteVisibilityOptions,
  sitePostCategoryLabels,
  sitePostLabelOptionsByCategory,
  siteVisibilityLabels
} from "@/lib/site-admin/constants";

type PostFormFieldsProps = {
  attachmentsDefaultValue?: string;
  bodyDefaultValue?: string;
  categoryDefaultValue?: SitePostCategory | "";
  hiddenFields?: ReactNode;
  formId?: string;
  labelsDefaultValue?: readonly string[];
  relatedLinksDefaultValue?: string;
  submitLabel: string;
  titleDefaultValue?: string;
  visibilityDefaultValue?: SiteContentVisibility | "";
};

export function PostFormFields({
  attachmentsDefaultValue = "",
  bodyDefaultValue = "",
  categoryDefaultValue = "",
  formId,
  hiddenFields,
  labelsDefaultValue = [],
  relatedLinksDefaultValue = "",
  submitLabel,
  titleDefaultValue = "",
  visibilityDefaultValue = ""
}: PostFormFieldsProps) {
  return (
    <>
      <UnsavedEditorGuard formId={formId} />
      {hiddenFields}

      <div className="admin-editor-stack">
        <section className="post-composer">
          <div className="post-composer-title-row">
            <div className="post-title-field">
              <label className="sr-only" htmlFor="site-post-title">
                게시물 제목
              </label>
              <input
                autoComplete="off"
                className="text-input text-input-title"
                id="site-post-title"
                name="title"
                placeholder="게시물의 제목을 입력하세요"
                required
                defaultValue={titleDefaultValue}
              />
            </div>
            <select
              aria-label="공개 상태"
              className="select-input post-visibility-select"
              name="visibility"
              required
              defaultValue={toEditableVisibility(visibilityDefaultValue)}
            >
              <option value="" disabled>
                공개 상태 선택
              </option>
              {selectableSiteVisibilityOptions.map((value) => (
                <option value={value} key={value}>
                  {siteVisibilityLabels[value]}
                </option>
              ))}
            </select>
            <div className="post-composer-title-action">
              <FormSubmitButton formId={formId} label={submitLabel} requireDirty={Boolean(formId)} />
            </div>
          </div>

          <div className="post-composer-meta-grid">
            <PostCategoryWorkshopFields
              categoryOptions={selectableSitePostCategories.map((category) => ({
                value: category,
                label: sitePostCategoryLabels[category],
                labelOptions: sitePostLabelOptionsByCategory[category].map((label) => ({ value: label, label })),
                relatedWorkshopsAllowed: relatedWorkshopEnabledCategories.has(category)
              }))}
              initialCategory={categoryDefaultValue}
              initialLabels={labelsDefaultValue}
            />
          </div>

          <div className="post-composer-body">
            <RichTextEditor name="body" initialValue={bodyDefaultValue} />
            <div className="editor-attachment-group">
              <div className="editor-attachment-grid">
                <AttachmentUploader defaultValue={attachmentsDefaultValue} />
                <LinkListInput
                  defaultValue={relatedLinksDefaultValue}
                  hint="구글폼, 구글드라이브, 외부 페이지 주소를 최대 3개까지 첨부합니다."
                  maxItems={3}
                  name="relatedLinks"
                  title="링크 첨부"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function toEditableVisibility(value: SiteContentVisibility | "") {
  if (!value) {
    return "";
  }

  return value === SiteContentVisibility.PUBLIC ? SiteContentVisibility.PUBLIC : SiteContentVisibility.DRAFT;
}
