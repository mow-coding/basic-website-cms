import { describe, expect, it } from "vitest";
import { sanitizePublicPostBody } from "@/lib/site-admin/public-content-sanitize";

describe("public site content sanitizing", () => {
  it("uses the same sanitizer before exposing post HTML through the public API", () => {
    const sanitized = sanitizePublicPostBody('<p>본문</p><img src="https://example.com/a.png" onerror="alert(1)">');

    expect(sanitized).toContain("<p>본문</p>");
    expect(sanitized).toContain('src="https://example.com/a.png"');
    expect(sanitized).not.toContain("onerror");
    expect(sanitized).not.toContain("alert(1)");
  });

  it("removes white paste backgrounds while preserving meaningful highlight colors", () => {
    const sanitized = sanitizePublicPostBody(
      '<p style="color:rgb(51, 51, 51);background-color:rgb(255, 255, 255)">본문</p><span style="background-color:#fff">흰 배경</span><span style="background-color:#fff2a8">강조</span>'
    );

    expect(sanitized).toContain('<p style="color:rgb(51, 51, 51)">본문</p>');
    expect(sanitized).toContain("<span>흰 배경</span>");
    expect(sanitized).toContain('background-color:#fff2a8');
    expect(sanitized).not.toContain("rgb(255, 255, 255)");
    expect(sanitized).not.toMatch(/background-color:#fff(?=[";])/);
  });

  it("keeps text formatting while removing neutral paste backgrounds", () => {
    const sanitized = sanitizePublicPostBody(
      '<p style="text-align:center;line-height:1.15;background-color:#ffffff"><span style="font-size:11pt;font-family:Arial, sans-serif">본문</span></p>'
    );

    expect(sanitized).toContain("text-align:center");
    expect(sanitized).toContain("line-height:1.15");
    expect(sanitized).toContain("font-size:11pt");
    expect(sanitized).toContain("font-family:Arial, sans-serif");
    expect(sanitized).not.toContain("background-color:#ffffff");
  });

  it("keeps bold formatting while removing neutral paste backgrounds", () => {
    const sanitized = sanitizePublicPostBody(
      '<p><strong>예시 제목</strong><span style="background-color:#ffffff;font-weight:700">예시 본문 문구입니다</span></p>'
    );

    expect(sanitized).toContain("<strong>예시 제목</strong>");
    expect(sanitized).toContain("font-weight:700");
    expect(sanitized).not.toContain("background-color:#ffffff");
  });
});
