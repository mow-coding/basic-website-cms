import { describe, expect, it } from "vitest";
import { sanitizePostBody } from "@/lib/site-admin/sanitize";

describe("sanitizePostBody", () => {
  it("removes script tags and their executable content", () => {
    const sanitized = sanitizePostBody("<p>안전한 문장</p><script>alert(1)</script>");

    expect(sanitized).toContain("<p>안전한 문장</p>");
    expect(sanitized).not.toContain("<script");
    expect(sanitized).not.toContain("alert(1)");
  });

  it("removes event handler attributes from images", () => {
    const sanitized = sanitizePostBody('<img src="https://example.com/a.png" alt="a" onerror="alert(1)">');

    expect(sanitized).toContain('src="https://example.com/a.png"');
    expect(sanitized).toContain('alt="a"');
    expect(sanitized).not.toContain("onerror");
  });

  it("removes javascript URLs while keeping link text", () => {
    const sanitized = sanitizePostBody('<a href="javascript:alert(1)">나쁜 링크</a>');

    expect(sanitized).toContain(">나쁜 링크</a>");
    expect(sanitized).not.toContain("javascript:");
  });

  it("keeps ordinary rich-text elements used by the editor", () => {
    const sanitized = sanitizePostBody(
      '<h2 class="rt-size-lg">Heading 1</h2><h3>Heading 2</h3><h4 class="rt-size-base">Heading 3</h4><table><tbody><tr><td style="color:#123456">Cell</td></tr></tbody></table>'
    );

    expect(sanitized).toContain("<h2");
    expect(sanitized).toContain("<h3>Heading 2</h3>");
    expect(sanitized).toContain("<h4");
    expect(sanitized).toContain("rt-size-lg");
    expect(sanitized).toContain("rt-size-base");
    expect(sanitized).toContain("<table>");
    expect(sanitized).toContain('style="color:#123456"');
  });

  it("keeps document formatting styles commonly pasted from Google Docs", () => {
    const sanitized = sanitizePostBody(
      '<p style="text-align:center;line-height:1.15;margin:0"><span style="font-family:Arial, sans-serif;font-size:11pt;color:rgb(51, 51, 51);white-space:pre-wrap">Centered text</span></p><b style="font-weight:400">Normal weight wrapper</b><i style="font-style:italic;text-decoration:underline">Styled text</i>'
    );

    expect(sanitized).toContain("text-align:center");
    expect(sanitized).toContain("line-height:1.15");
    expect(sanitized).toContain("margin:0");
    expect(sanitized).toContain("font-family:Arial, sans-serif");
    expect(sanitized).toContain("font-size:11pt");
    expect(sanitized).toContain("white-space:pre-wrap");
    expect(sanitized).toContain("font-weight:400");
    expect(sanitized).toContain("font-style:italic");
    expect(sanitized).toContain("text-decoration:underline");
  });

  it("keeps bold tags and font-weight styles used by TinyMCE", () => {
    const sanitized = sanitizePostBody(
      '<p><strong>굵은 문장</strong><b>굵은 태그</b><span style="font-weight:bold">굵은 스타일</span><span style="font-weight:700">굵은 숫자</span></p>'
    );

    expect(sanitized).toContain("<strong>굵은 문장</strong>");
    expect(sanitized).toContain("<b>굵은 태그</b>");
    expect(sanitized).toContain("font-weight:bold");
    expect(sanitized).toContain("font-weight:700");
  });

  it("removes unsupported or unsafe pasted CSS values", () => {
    const sanitized = sanitizePostBody(
      '<p style="text-align:expression(alert(1));font-family:url(javascript:alert(1));font-size:999pt;line-height:0;color:#123456">Unsafe styles</p>'
    );

    expect(sanitized).toContain('style="color:#123456"');
    expect(sanitized).not.toContain("text-align");
    expect(sanitized).not.toContain("font-family");
    expect(sanitized).not.toContain("font-size");
    expect(sanitized).not.toContain("line-height");
    expect(sanitized).not.toContain("javascript:");
    expect(sanitized).not.toContain("expression");
  });

  it("keeps safe table border and spacing styles commonly pasted from Google Docs", () => {
    const sanitized = sanitizePostBody(
      '<table style="width:320pt"><tbody><tr><td colspan="2" style="border:1pt solid #000000;padding:5pt 5pt 5pt 5pt;vertical-align:middle;text-align:center">Merged</td></tr><tr><td style="border-right:none">Left</td><td style="border-left:none">Right</td></tr></tbody></table>'
    );

    expect(sanitized).toContain("width:320pt");
    expect(sanitized).toContain("border:1pt solid #000000");
    expect(sanitized).toContain("padding:5pt 5pt 5pt 5pt");
    expect(sanitized).toContain("vertical-align:middle");
    expect(sanitized).toContain("text-align:center");
    expect(sanitized).toContain("border-right:none");
    expect(sanitized).toContain("border-left:none");
  });

  it("keeps table cell spans used by merged cells", () => {
    const sanitized = sanitizePostBody(
      '<table><tbody><tr><th colspan="2">Header</th></tr><tr><td rowspan="3" colspan="2">Merged</td></tr><tr><td rowspan="0">Remaining rows</td></tr></tbody></table>'
    );

    expect(sanitized).toContain('colspan="2"');
    expect(sanitized).toContain('rowspan="3"');
    expect(sanitized).toContain('rowspan="0"');
  });

  it("keeps the empty list wrapper class used to hide generated placeholder bullets", () => {
    const sanitized = sanitizePostBody(
      '<ul><li class="cms-empty-list-wrapper"><ul><li>들여쓴 항목</li></ul></li></ul>'
    );

    expect(sanitized).toContain('class="cms-empty-list-wrapper"');
    expect(sanitized).toContain("<li>들여쓴 항목</li>");
  });

  it("keeps safe list marker styles used by rich text lists", () => {
    const sanitized = sanitizePostBody(
      '<ul style="list-style-type:square"><li style="list-style-type:circle">List item</li></ul><ol style="list-style-type:upper-roman"><li>Ordered item</li></ol>'
    );

    expect(sanitized).toContain("list-style-type:square");
    expect(sanitized).toContain("list-style-type:circle");
    expect(sanitized).toContain("list-style-type:upper-roman");
  });

  it("keeps horizontal rules and supported line-height presets", () => {
    const sanitized = sanitizePostBody(
      '<p style="line-height:1.1">Tight</p><hr><p style="line-height:2.5">Loose</p><p style="line-height:3">Max preset</p><p style="line-height:4">Too loose</p>'
    );

    expect(sanitized).toContain("line-height:1.1");
    expect(sanitized).toContain("line-height:2.5");
    expect(sanitized).toContain("line-height:3");
    expect(sanitized).toMatch(/<hr\s*\/?>/);
    expect(sanitized).not.toContain("line-height:4");
  });

  it("keeps table cell styles used by the editor table tools", () => {
    const sanitized = sanitizePostBody(
      '<table style="width:60%;margin-left:auto;margin-right:auto;float:right"><tbody><tr><th style="background-color:#edf3fb;color:#2a5f7f;font-weight:800;width:120pt;height:24pt;text-align:center">Head</th><td style="background-color:#ffeeaa;border-color:#123456;border-style:dashed;border-width:medium;font-size:14pt;line-height:1.5;vertical-align:middle;width:80pt;height:20pt">Cell</td></tr></tbody><tfoot><tr><td style="text-align:right">Foot</td></tr></tfoot></table>'
    );

    expect(sanitized).toContain("width:60%");
    expect(sanitized).toContain("margin-left:auto");
    expect(sanitized).toContain("margin-right:auto");
    expect(sanitized).toContain("float:right");
    expect(sanitized).toContain("background-color:#edf3fb");
    expect(sanitized).toContain("color:#2a5f7f");
    expect(sanitized).toContain("font-weight:800");
    expect(sanitized).toContain("text-align:center");
    expect(sanitized).toContain("background-color:#ffeeaa");
    expect(sanitized).toContain("border-color:#123456");
    expect(sanitized).toContain("border-style:dashed");
    expect(sanitized).toContain("border-width:medium");
    expect(sanitized).toContain("font-size:14pt");
    expect(sanitized).toContain("line-height:1.5");
    expect(sanitized).toContain("vertical-align:middle");
    expect(sanitized).toContain("width:80pt");
    expect(sanitized).toContain("height:20pt");
    expect(sanitized).toContain("<tfoot>");
  });

  it("removes invalid table cell span values", () => {
    const sanitized = sanitizePostBody(
      '<table><tbody><tr><td colspan="javascript:alert(1)" rowspan="-1">Unsafe</td><td colspan="1001">Too wide</td><td rowspan="65535">Too tall</td></tr></tbody></table>'
    );

    expect(sanitized).toContain("<td>Unsafe</td>");
    expect(sanitized).toContain("<td>Too wide</td>");
    expect(sanitized).toContain("<td>Too tall</td>");
    expect(sanitized).not.toContain("colspan=");
    expect(sanitized).not.toContain("rowspan=");
    expect(sanitized).not.toContain("javascript:");
  });
});
