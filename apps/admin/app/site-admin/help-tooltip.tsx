"use client";

import { useId } from "react";

type HelpTooltipProps = {
  children: string;
};

export function HelpTooltip({ children }: HelpTooltipProps) {
  const tooltipId = useId();

  return (
    <span className="help-tooltip">
      <button
        aria-describedby={tooltipId}
        aria-label="도움말"
        className="help-tooltip-trigger"
        type="button"
      >
        ?
      </button>
      <span className="help-tooltip-content" id={tooltipId} role="tooltip">
        {children}
      </span>
    </span>
  );
}
