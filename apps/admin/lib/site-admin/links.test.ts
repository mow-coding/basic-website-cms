import { describe, expect, it } from "vitest";
import { normalizeHttpUrl, parseLinkLines } from "@/lib/site-admin/links";

describe("site-admin link parsing", () => {
  it("parses title and http URL pairs", () => {
    expect(parseLinkLines("신청 링크 | https://example.com/form", 5)).toEqual([
      {
        title: "신청 링크",
        url: "https://example.com/form"
      }
    ]);
  });

  it("uses the URL as the title when no title separator is present", () => {
    expect(parseLinkLines("https://example.com/form", 5)).toEqual([
      {
        title: "https://example.com/form",
        url: "https://example.com/form"
      }
    ]);
  });

  it("adds https to common bare web URLs", () => {
    expect(parseLinkLines("신청 링크 | forms.gle/abc123", 5)).toEqual([
      {
        title: "신청 링크",
        url: "https://forms.gle/abc123"
      }
    ]);
  });

  it("allows pipe characters inside the link title", () => {
    expect(parseLinkLines("예시 기관 | 소식 | 게시판 | https://example.com/bbs/view.asp?bid=bid_3&id=124495", 5)).toEqual([
      {
        title: "예시 기관 | 소식 | 게시판",
        url: "https://example.com/bbs/view.asp?bid=bid_3&id=124495"
      }
    ]);
  });

  it("drops invalid or non-http links instead of throwing", () => {
    expect(parseLinkLines("나쁜 링크 | javascript:alert(1)\n메일 | mailto:test@example.com", 5)).toEqual([]);
  });

  it("enforces the configured item limit", () => {
    const value = [
      "A | https://example.com/a",
      "B | https://example.com/b",
      "C | https://example.com/c"
    ].join("\n");

    expect(parseLinkLines(value, 2)).toHaveLength(2);
  });

  it("normalizes valid http URLs and rejects invalid schemes", () => {
    expect(normalizeHttpUrl("http://example.com/path", "url")).toBe("http://example.com/path");
    expect(() => normalizeHttpUrl("ftp://example.com/path", "url")).toThrow("Invalid URL field: url");
  });
});
