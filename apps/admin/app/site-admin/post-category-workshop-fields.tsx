"use client";

import { useMemo, useState } from "react";

type LabelOption = {
  label: string;
  value: string;
};

type CategoryOption = {
  label: string;
  labelOptions: LabelOption[];
  relatedWorkshopsAllowed: boolean;
  value: string;
};

type PostCategoryWorkshopFieldsProps = {
  categoryOptions: CategoryOption[];
  initialCategory: string;
  initialLabels: readonly string[];
};

export function PostCategoryWorkshopFields({
  categoryOptions,
  initialCategory,
  initialLabels
}: PostCategoryWorkshopFieldsProps) {
  const normalizedInitialCategory = categoryOptions.some((option) => option.value === initialCategory)
    ? initialCategory
    : "";
  const [category, setCategory] = useState(normalizedInitialCategory);
  const initialLabelOptions = categoryOptions.find((option) => option.value === normalizedInitialCategory)?.labelOptions ?? [];
  const [selectedLabels, setSelectedLabels] = useState<string[]>(
    initialLabels.filter((label) => initialLabelOptions.some((option) => option.value === label))
  );
  const selectedCategoryOption = useMemo(
    () => categoryOptions.find((option) => option.value === category),
    [category, categoryOptions]
  );
  const labelOptions = selectedCategoryOption?.labelOptions ?? [];
  const labelsAllowed = labelOptions.length > 0;
  // 안내 카테고리는 라벨이 없고, 프로그램 라벨은 복수 선택 가능.
  const isSingleSelect = category === "COUNSELING";
  const labelControlName = "관련 프로그램 선택";
  const publicLocation = getPublicLocationLabel(category, selectedLabels);

  function toggleLabel(value: string) {
    setSelectedLabels((current) => {
      if (current.includes(value)) {
        return current.filter((item) => item !== value);
      }

      return isSingleSelect ? [value] : [...current, value];
    });
  }

  return (
    <>
      <select
        aria-label="카테고리"
        className="select-input"
        name="category"
        required
        value={category}
        onChange={(event) => {
          const nextCategory = event.target.value;
          const nextLabelOptions = categoryOptions.find((option) => option.value === nextCategory)?.labelOptions ?? [];
          const nextIsSingle = nextCategory === "COUNSELING";

          setCategory(nextCategory);
          setSelectedLabels((current) => {
            const kept = current.filter((label) => nextLabelOptions.some((option) => option.value === label));
            return nextIsSingle ? kept.slice(0, 1) : kept;
          });
        }}
      >
        <option value="" disabled>
          카테고리 선택
        </option>
        {categoryOptions.map((option) => (
          <option value={option.value} key={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <fieldset className="workshop-fieldset">
        <legend className="sr-only">{labelControlName}</legend>
        {labelsAllowed ? (
          <div className="workshop-badge-group" role={isSingleSelect ? "radiogroup" : "group"} aria-label={labelControlName}>
            {labelOptions.map((option) => {
              const selected = selectedLabels.includes(option.value);

              return (
                <button
                  aria-checked={selected}
                  className={`workshop-badge-toggle workshop-badge-toggle-${toLabelBadgeSlug(option.value)} ${
                    selected ? "active" : ""
                  }`}
                  key={option.value}
                  role={isSingleSelect ? "radio" : "checkbox"}
                  type="button"
                  onClick={() => toggleLabel(option.value)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        ) : (
          <span className="workshop-badge-placeholder">해당 없음</span>
        )}
        {selectedLabels.map((label) => (
          <input key={label} name="labels" type="hidden" value={label} />
        ))}
      </fieldset>
      <div className="publish-preview" aria-live="polite">
        {publicLocation === emptyPublicLocationMessage ? (
          <span>{emptyPublicLocationMessage}</span>
        ) : (
          <span>
            현재 게시물이 <strong>{publicLocation}</strong>에 표시됩니다
          </span>
        )}
      </div>
    </>
  );
}

function toLabelBadgeSlug(value: string) {
  const slug = value
    .replace(/^프로그램/, "program-")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "default";
}

const emptyPublicLocationMessage = "카테고리를 선택해주세요";

function getPublicLocationLabel(category: string, labels: string[]) {
  if (!category) {
    return emptyPublicLocationMessage;
  }

  if (category === "COUNSELING") {
    return "안내";
  }

  // 프로그램 라벨 2개 이상 = 여러 프로그램 동등 안내 → 프로그램 개요의 '일반' 탭
  if (labels.length >= 2) {
    return "프로그램 일반 공지";
  }

  if (category === "GREEN_BOARD") {
    return labels.length > 0 ? `${labels[0]} 자유게시판` : "소식";
  }

  if (category === "RESOURCE") {
    return labels.length > 0 ? `${labels[0]} 자료실` : "소식";
  }

  return labels.length > 0 ? `${labels[0]} 프로그램 공지` : "소식";
}
