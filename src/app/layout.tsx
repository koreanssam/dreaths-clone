import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "DREATHS — Threads 바이럴 & 쿠팡 파트너스 자동화 플랫폼",
  description:
    "실시간 트렌드(네이버 데이터랩, 구글 트렌드, 하비스페이스) 포착부터 쿠팡 파트너스 딥링크 매핑, 페르소나 기반 2단 타래 직조 및 Meta Threads 연쇄 발행 플랫폼",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{document.querySelector('meta[name="color-scheme"]').content=localStorage.getItem("color-scheme")??"light dark";}catch(e){}`,
          }}
        />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
