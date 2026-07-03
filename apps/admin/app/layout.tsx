import type { Metadata } from "next";
import { Suspense } from "react";
import { NavigationProgress } from "@/app/navigation-progress";
import "./globals.css";

export const metadata: Metadata = {
  title: "모오 임상심리연구소 관리자",
  description: "모오 임상심리연구소 공개 홈페이지 관리자 화면입니다.",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "64x64" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" }
    ],
    shortcut: "/favicon.png",
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }]
  },
  robots: {
    index: false,
    follow: false
  }
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ko">
      <body>
        <a className="skip-link" href="#main-content">
          본문으로 바로가기
        </a>
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
