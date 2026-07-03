import sanitizeHtml from "sanitize-html";

const tableCellSpanAttributeNames = ["colspan", "rowspan"] as const;
const tableCellSpanLimits = {
  colspan: { maximum: 1000, minimum: 1 },
  rowspan: { maximum: 65534, minimum: 0 }
} as const;
const richTextColorPattern = /^#[0-9a-f]{3,8}$/i;
const richTextRgbColorPattern = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i;
const richTextCssLength = "(?:0|(?:[0-9]{1,3}(?:\\.\\d{1,3})?(?:px|pt|em|rem|%)))";
const richTextCssBorderWidth = `(?:${richTextCssLength}|thin|medium|thick)`;
const richTextCssBorderStyle = "(?:none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset)";
const richTextCssColor = "(?:#[0-9a-f]{3,8}|rgb\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*\\))";
const richTextFontFamilyPattern =
  /^(?:"[^"()<>;{}]+"|'[^'()<>;{}]+'|[0-9A-Za-z가-힣 ._-]+)(?:\s*,\s*(?:"[^"()<>;{}]+"|'[^'()<>;{}]+'|[0-9A-Za-z가-힣 ._-]+))*$/u;
const richTextFontSizePattern =
  /^(?:(?:[6-9]|[1-6]\d|7[0-2])(?:\.\d{1,3})?(?:px|pt)|(?:0\.[5-9]|[1-3](?:\.\d{1,3})?)(?:em|rem)|(?:[5-9]\d|[12]\d{2}|300)(?:\.\d{1,3})?%)$/i;
const richTextLineHeightPattern =
  /^(?:normal|(?:[1-2](?:\.\d{1,3})?|3(?:\.0{1,3})?)|(?:[6-9]|[1-9]\d)(?:\.\d{1,3})?(?:px|pt)|(?:[5-9]\d|[12]\d{2}|300)(?:\.\d{1,3})?%)$/i;
const richTextTextAlignPattern = /^(?:left|right|center|justify|start|end)$/i;
const richTextFontWeightPattern = /^(?:normal|bold|bolder|lighter|[1-9]00)$/i;
const richTextFontStylePattern = /^(?:normal|italic|oblique)$/i;
const richTextTextDecorationPattern =
  /^(?:none|underline|line-through|underline line-through|line-through underline)$/i;
const richTextListStyleTypePattern =
  /^(?:disc|circle|square|decimal|decimal-leading-zero|lower-alpha|upper-alpha|lower-latin|upper-latin|lower-roman|upper-roman|hangul|hangul-consonant|korean-hangul-formal|korean-hanja-formal|korean-hanja-informal)$/i;
const richTextWhiteSpacePattern = /^(?:normal|pre|pre-wrap|pre-line|break-spaces)$/i;
const richTextVerticalAlignPattern = /^(?:baseline|sub|super|text-top|text-bottom|middle|top|bottom)$/i;
const richTextFloatPattern = /^(?:left|right|none)$/i;
const richTextLengthPattern = new RegExp(`^${richTextCssLength}$`, "i");
const richTextLengthOrAutoPattern = new RegExp(`^(?:auto|${richTextCssLength})$`, "i");
const richTextSpacingPattern = new RegExp(`^${richTextCssLength}(?:\\s+${richTextCssLength}){0,3}$`, "i");
const richTextBorderColorPattern = new RegExp(`^(?:${richTextCssColor}|transparent)$`, "i");
const richTextBorderStylePattern = new RegExp(`^${richTextCssBorderStyle}$`, "i");
const richTextBorderWidthPattern = new RegExp(`^${richTextCssBorderWidth}$`, "i");
const richTextBorderPattern = new RegExp(
  `^(?:none|hidden|(?:(?:${richTextCssBorderWidth}\\s+)?${richTextCssBorderStyle}(?:\\s+${richTextCssColor})?(?:\\s+${richTextCssBorderWidth})?|${richTextCssBorderWidth}\\s+${richTextCssBorderStyle}\\s+${richTextCssColor}))$`,
  "i"
);
const richTextOverflowWrapPattern = /^(?:normal|break-word|anywhere)$/i;

const richTextClasses = [
  "rt-font-sans",
  "rt-font-serif",
  "rt-font-nanum-gothic",
  "rt-font-dotum",
  "rt-font-dotumche",
  "rt-font-gulim",
  "rt-font-gulimche",
  "rt-font-batang",
  "rt-font-batangche",
  "rt-font-gungsuh",
  "rt-font-arial",
  "rt-font-tahoma",
  "rt-font-times",
  "rt-font-verdana",
  "rt-font-courier",
  "ql-font-nanum-gothic",
  "ql-font-dotum",
  "ql-font-dotumche",
  "ql-font-gulim",
  "ql-font-gulimche",
  "ql-font-batang",
  "ql-font-batangche",
  "ql-font-gungsuh",
  "ql-font-arial",
  "ql-font-tahoma",
  "ql-font-times-new-roman",
  "ql-font-verdana",
  "ql-font-courier-new",
  "rt-size-sm",
  "rt-size-base",
  "rt-size-lg",
  "rt-size-xl",
  "rt-size-7pt",
  "rt-size-8pt",
  "rt-size-9pt",
  "rt-size-10pt",
  "rt-size-11pt",
  "rt-size-12pt",
  "rt-size-14pt",
  "rt-size-18pt",
  "rt-size-24pt",
  "rt-size-36pt",
  "ql-size-7pt",
  "ql-size-8pt",
  "ql-size-9pt",
  "ql-size-10pt",
  "ql-size-11pt",
  "ql-size-12pt",
  "ql-size-14pt",
  "ql-size-18pt",
  "ql-size-24pt",
  "ql-size-36pt",
  "rt-color-black",
  "rt-color-gray",
  "rt-color-red",
  "rt-color-blue",
  "rt-color-green",
  "rt-bg-yellow",
  "rt-bg-blue",
  "rt-bg-green",
  "rt-bg-red",
  "rt-align-left",
  "rt-align-center",
  "rt-align-right",
  "rt-align-justify",
  "ql-align-center",
  "ql-align-right",
  "ql-align-justify",
  "ql-indent-1",
  "ql-indent-2",
  "ql-indent-3",
  "ql-indent-4",
  "ql-indent-5",
  "ql-indent-6",
  "ql-indent-7",
  "ql-indent-8",
  "ql-indent-9",
  "ql-ui",
  "cms-empty-list-wrapper",
  "rt-leading-tight",
  "rt-leading-normal",
  "rt-leading-loose",
  "rt-tracking-normal",
  "rt-tracking-wide"
];

export function sanitizePostBody(html: string) {
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "ul",
      "ol",
      "li",
      "a",
      "img",
      "span",
      "h2",
      "h3",
      "h4",
      "blockquote",
      "hr",
      "s",
      "strike",
      "del",
      "sup",
      "sub",
      "table",
      "thead",
      "tbody",
      "tfoot",
      "tr",
      "th",
      "td"
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt"],
      span: ["class", "style"],
      p: ["class", "style"],
      strong: ["style"],
      b: ["style"],
      em: ["style"],
      i: ["style"],
      u: ["style"],
      s: ["style"],
      strike: ["style"],
      del: ["style"],
      sup: ["style"],
      sub: ["style"],
      ul: ["style"],
      ol: ["style"],
      li: ["class", "data-list", "style"],
      h2: ["class", "style"],
      h3: ["class", "style"],
      h4: ["class", "style"],
      blockquote: ["class", "style"],
      table: ["style"],
      tfoot: ["style"],
      tr: ["style"],
      th: ["class", "style", ...tableCellSpanAttributeNames],
      td: ["class", "style", ...tableCellSpanAttributeNames]
    },
    allowedClasses: {
      span: richTextClasses,
      p: richTextClasses,
      li: richTextClasses,
      h2: richTextClasses,
      h3: richTextClasses,
      h4: richTextClasses,
      blockquote: richTextClasses,
      th: richTextClasses,
      td: richTextClasses
    },
    allowedStyles: {
      "*": {
        "background-color": [richTextColorPattern, richTextRgbColorPattern],
        border: [richTextBorderPattern],
        "border-bottom": [richTextBorderPattern],
        "border-color": [richTextBorderColorPattern],
        "border-left": [richTextBorderPattern],
        "border-right": [richTextBorderPattern],
        "border-style": [richTextBorderStylePattern],
        "border-top": [richTextBorderPattern],
        "border-width": [richTextBorderWidthPattern],
        color: [richTextColorPattern, richTextRgbColorPattern],
        "font-family": [richTextFontFamilyPattern],
        "font-size": [richTextFontSizePattern],
        "font-style": [richTextFontStylePattern],
        "font-weight": [richTextFontWeightPattern],
        float: [richTextFloatPattern],
        height: [richTextLengthPattern],
        "line-height": [richTextLineHeightPattern],
        "list-style-type": [richTextListStyleTypePattern],
        margin: [richTextSpacingPattern],
        "margin-bottom": [richTextLengthPattern],
        "margin-left": [richTextLengthOrAutoPattern],
        "margin-right": [richTextLengthOrAutoPattern],
        "margin-top": [richTextLengthPattern],
        "overflow-wrap": [richTextOverflowWrapPattern],
        padding: [richTextSpacingPattern],
        "padding-bottom": [richTextLengthPattern],
        "padding-left": [richTextLengthPattern],
        "padding-right": [richTextLengthPattern],
        "padding-top": [richTextLengthPattern],
        "text-align": [richTextTextAlignPattern],
        "text-decoration": [richTextTextDecorationPattern],
        "vertical-align": [richTextVerticalAlignPattern],
        "white-space": [richTextWhiteSpacePattern],
        width: [richTextLengthPattern]
      }
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      img: ["http", "https"]
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "noreferrer",
        target: "_blank"
      }, true),
      td: sanitizeTableCellSpanAttributes,
      th: sanitizeTableCellSpanAttributes
    }
  }).trim();
}

function sanitizeTableCellSpanAttributes(tagName: string, attributes: Record<string, string>) {
  const sanitizedAttributes = { ...attributes };

  for (const attributeName of tableCellSpanAttributeNames) {
    sanitizeTableCellSpanAttribute(sanitizedAttributes, attributeName);
  }

  return {
    attribs: sanitizedAttributes,
    tagName
  };
}

function sanitizeTableCellSpanAttribute(
  attributes: Record<string, string>,
  attributeName: (typeof tableCellSpanAttributeNames)[number]
) {
  const rawValue = attributes[attributeName];
  if (rawValue === undefined) {
    return;
  }

  const value = rawValue.trim();
  if (!/^\d+$/.test(value)) {
    delete attributes[attributeName];
    return;
  }

  const span = Number(value);
  const { maximum, minimum } = tableCellSpanLimits[attributeName];

  if (!Number.isSafeInteger(span) || span < minimum || span > maximum) {
    delete attributes[attributeName];
    return;
  }

  attributes[attributeName] = String(span);
}
