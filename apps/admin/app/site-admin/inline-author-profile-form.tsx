"use client";

import { useActionState } from "react";
import { AdminToast } from "@/app/site-admin/admin-toast";
import { saveAuthorDisplayNameAction, type AuthorDisplayNameActionState } from "@/app/site-admin/actions";

type InlineAuthorProfileFormProps = {
  displayName: string;
};

function getInitialState(displayName: string): AuthorDisplayNameActionState {
  return {
    displayName,
    message: "",
    status: "idle",
    version: 0
  };
}

export function InlineAuthorProfileForm({ displayName }: InlineAuthorProfileFormProps) {
  const [state, formAction, pending] = useActionState(saveAuthorDisplayNameAction, getInitialState(displayName));
  const inputDefaultValue = state.status === "success" ? state.displayName : displayName;

  return (
    <>
      {state.status === "success" || state.status === "error" ? (
        <AdminToast
          clearUrlState={false}
          key={`${state.status}:${state.version}`}
          message={state.message}
          tone={state.status === "success" ? "success" : "error"}
        />
      ) : null}

      <form autoComplete="off" className="admin-display-name-form" action={formAction} aria-label="작성자 별명 수정">
        <div className="admin-display-name-control">
          <input
            autoComplete="off"
            aria-label="작성자 별명"
            className="admin-display-name-input"
            id="admin-display-name"
            name="displayName"
            key={`display-name-${state.status === "success" ? state.version : 0}`}
            defaultValue={inputDefaultValue}
            maxLength={12}
            minLength={2}
            pattern="[0-9A-Za-z가-힣]{2,12}"
            required
            title="공백 없이 한글, 영문, 숫자만 2~12자로 입력해 주세요."
          />
          <button className="admin-display-name-submit" type="submit" disabled={pending} aria-busy={pending}>
            {pending ? "저장 중" : "별명 저장"}
          </button>
        </div>
      </form>
    </>
  );
}
