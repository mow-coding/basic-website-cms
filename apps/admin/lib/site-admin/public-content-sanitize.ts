import { sanitizePostBody } from "@/lib/site-admin/sanitize";

export function sanitizePublicPostBody(body: string) {
  return removeNeutralPasteBackgrounds(sanitizePostBody(body));
}

function removeNeutralPasteBackgrounds(html: string) {
  return html.replace(/\sstyle="([^"]*)"/gi, (_match, styleValue: string) => {
    const declarations = styleValue
      .split(";")
      .map((declaration) => declaration.trim())
      .filter(Boolean)
      .filter((declaration) => !isNeutralBackgroundDeclaration(declaration));

    return declarations.length > 0 ? ` style="${declarations.join(";")}"` : "";
  });
}

function isNeutralBackgroundDeclaration(declaration: string) {
  const [property, ...valueParts] = declaration.split(":");
  if (property?.trim().toLowerCase() !== "background-color") {
    return false;
  }

  return isNeutralBackgroundColor(valueParts.join(":"));
}

function isNeutralBackgroundColor(value: string) {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "");

  return (
    normalized === "white" ||
    normalized === "#fff" ||
    normalized === "#ffffff" ||
    normalized === "#ffffffff" ||
    normalized === "rgb(255,255,255)" ||
    normalized === "rgba(255,255,255,1)" ||
    normalized === "transparent"
  );
}
