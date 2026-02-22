import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LingoBox",
  description: "사진 업로드 및 코멘트 관리 서비스",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center">
            <a href="/" className="text-xl font-bold text-gray-900 tracking-tight">
              LingoBox
            </a>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
