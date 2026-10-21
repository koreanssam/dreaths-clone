"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Flame,
  PenTool,
  Users,
  BookmarkCheck,
  Settings,
  Sun,
  Moon,
  Sparkles,
  CheckCircle2,
  X,
  ExternalLink,
} from "lucide-react";
import type { AccountProvider } from "@/types";

interface ApiStatusMap {
  naver?: { configured: boolean; apiKeyPreview: string };
  coupang?: { configured: boolean; apiKeyPreview: string };
  gemini?: { configured: boolean; apiKeyPreview: string };
  upstage?: { configured: boolean; apiKeyPreview: string };
  openai?: { configured: boolean; apiKeyPreview: string };
  threads?: { configured: boolean; apiKeyPreview: string };
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [schemeLabel, setSchemeLabel] = useState<"dark" | "light">("dark");
  const [apiStatus, setApiStatus] = useState<ApiStatusMap>({});
  const [savingProvider, setSavingProvider] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Form states for credentials modal
  const [coupangAccess, setCoupangAccess] = useState("");
  const [coupangSecret, setCoupangSecret] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [upstageKey, setUpstageKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [threadsUserId, setThreadsUserId] = useState("");
  const [threadsToken, setThreadsToken] = useState("");
  const [naverId, setNaverId] = useState("");
  const [naverSecret, setNaverSecret] = useState("");

  useEffect(() => {
    const meta = document.querySelector(
      'meta[name="color-scheme"]'
    ) as HTMLMetaElement | null;
    const stored = localStorage.getItem("color-scheme");
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const current =
      stored === "dark" || stored === "light"
        ? stored
        : systemDark
        ? "dark"
        : "light";
    setSchemeLabel(current);
    if (meta && stored) {
      meta.content = stored;
    }

    fetchApiStatus();
  }, []);

  // Fallback for browsers without <dialog closedby="any"> support per modern-web-guidance
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!("closedBy" in HTMLDialogElement.prototype)) {
      const handleBackdropClick = (event: MouseEvent) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isDialogContent =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;
        if (!isDialogContent) {
          dialog.close();
        }
      };
      dialog.addEventListener("click", handleBackdropClick);
      return () => dialog.removeEventListener("click", handleBackdropClick);
    }
  }, []);

  async function fetchApiStatus() {
    try {
      const res = await fetch("/api/v1/accounts");
      const json = await res.json();
      if (json.ok) {
        setApiStatus(json.status || {});
      }
    } catch {
      // ignore
    }
  }

  function toggleColorScheme() {
    const meta = document.querySelector(
      'meta[name="color-scheme"]'
    ) as HTMLMetaElement | null;
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const systemScheme = systemDark ? "dark" : "light";
    const targetScheme = schemeLabel === "dark" ? "light" : "dark";

    if (targetScheme !== systemScheme) {
      localStorage.setItem("color-scheme", targetScheme);
      if (meta) meta.content = targetScheme;
    } else {
      localStorage.removeItem("color-scheme");
      if (meta) meta.content = "light dark";
    }
    setSchemeLabel(targetScheme);
  }

  async function saveCredential(
    provider: AccountProvider,
    payload: Record<string, string>
  ) {
    setSavingProvider(provider);
    try {
      const res = await fetch("/api/v1/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, ...payload }),
      });
      const json = await res.json();
      if (json.ok) {
        setToast(`${provider.toUpperCase()} API 연동 정보가 저장되었습니다.`);
        setTimeout(() => setToast(null), 3000);
        await fetchApiStatus();
      }
    } finally {
      setSavingProvider(null);
    }
  }

  const navItems = [
    {
      href: "/dashboard/insights",
      label: "트렌드 & 인사이트",
      sub: "네이버 · 구글 · 하비스페이스",
      icon: Flame,
      active: pathname.includes("/insights"),
    },
    {
      href: "/write",
      label: "스마트 에디터",
      sub: "쿠팡 매칭 & 2단 타래 직조",
      icon: PenTool,
      active: pathname.startsWith("/write"),
    },
    {
      href: "/dashboard/personas",
      label: "페르소나 스토리지",
      sub: "기본 4종 & 커스텀 말투",
      icon: Users,
      active: pathname.includes("/personas"),
    },
    {
      href: "/benchmark",
      label: "벤치마킹 & 발행내역",
      sub: "바이럴 공식 & 스케줄 로그",
      icon: BookmarkCheck,
      active: pathname.startsWith("/benchmark"),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside
        className="w-full lg:w-72 shrink-0 border-b lg:border-b-0 lg:border-r p-4 lg:p-5 flex flex-col justify-between"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <div>
          <div className="flex items-center justify-between mb-6">
            <Link href="/dashboard/insights" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                D
              </div>
              <div>
                <div className="font-extrabold tracking-tight text-base flex items-center gap-1.5">
                  DREATHS
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-400">
                    PRO
                  </span>
                </div>
                <p
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  Threads x 쿠팡 파트너스 자동화
                </p>
              </div>
            </Link>

            <button
              type="button"
              onClick={toggleColorScheme}
              className="p-2 rounded-lg border text-xs flex items-center gap-1 cursor-pointer hover:opacity-80"
              style={{
                borderColor: "var(--border-subtle)",
                backgroundColor: "var(--bg-elevated)",
              }}
              title="다크/라이트 테마 전환"
            >
              {schemeLabel === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>
          </div>

          <nav className="grid grid-cols-2 lg:grid-cols-1 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all border ${
                    item.active
                      ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                      : "border-transparent hover:opacity-90"
                  }`}
                  style={
                    !item.active
                      ? {
                          backgroundColor: "var(--bg-elevated)",
                          color: "var(--text-primary)",
                        }
                      : undefined
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {item.label}
                    </div>
                    <div
                      className={`text-[11px] truncate ${
                        item.active ? "text-indigo-100" : ""
                      }`}
                      style={
                        !item.active
                          ? { color: "var(--text-muted)" }
                          : undefined
                      }
                    >
                      {item.sub}
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-6 pt-4 border-t space-y-3" style={{ borderColor: "var(--border-subtle)" }}>
          <div
            className="p-3 rounded-xl border text-xs space-y-2"
            style={{
              backgroundColor: "var(--bg-elevated)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <div className="flex items-center justify-between font-semibold">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                외부 플랫폼 연동 상태
              </span>
              <button
                type="button"
                onClick={() => dialogRef.current?.showModal()}
                className="text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                키 설정
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              {(["upstage", "openai", "gemini", "coupang", "threads", "naver"] as const).map((k) => {
                const isLive = apiStatus[k]?.configured;
                return (
                  <div
                    key={k}
                    className="flex items-center justify-between px-2 py-1 rounded border"
                    style={{
                      backgroundColor: "var(--bg-surface)",
                      borderColor: "var(--border-subtle)",
                    }}
                  >
                    <span className="uppercase font-medium">{k}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        isLive
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-amber-500/15 text-amber-400"
                      }`}
                    >
                      {isLive ? "LIVE" : "AUTO"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 p-4 lg:p-8 overflow-y-auto">
        {children}
      </main>

      {/* Native <dialog closedby="any"> Modal for API Keys Configuration */}
      <dialog
        ref={dialogRef}
        closedby="any"
        aria-labelledby="apiSettingsDialogTitle"
        className="w-full max-w-2xl rounded-2xl p-0 border shadow-2xl m-auto"
        style={{
          backgroundColor: "var(--bg-surface)",
          color: "var(--text-primary)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "var(--border-subtle)" }}>
            <div>
              <h2 id="apiSettingsDialogTitle" className="text-lg font-bold">
                외부 API 자격증명 설정 (ACCOUNTS 스토리지)
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                키를 입력하지 않아도 내장 시뮬레이션/RSS 엔진이 동작하며, 실제 키를 등록하면 즉시 실서버 API로 전환됩니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="p-1.5 rounded-lg border cursor-pointer"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {toast && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {toast}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Coupang */}
            <div
              className="p-4 rounded-xl border space-y-2.5"
              style={{
                backgroundColor: "var(--bg-elevated)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <div className="font-bold text-sm flex items-center justify-between">
                <span>쿠팡 파트너스 (HMAC-SHA256)</span>
                <span className="text-[10px] text-indigo-400">CEA 서명</span>
              </div>
              <input
                type="text"
                placeholder="Access Key"
                value={coupangAccess}
                onChange={(e) => setCoupangAccess(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-xs"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-subtle)",
                }}
              />
              <input
                type="password"
                placeholder="Secret Key"
                value={coupangSecret}
                onChange={(e) => setCoupangSecret(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-xs"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-subtle)",
                }}
              />
              <button
                type="button"
                disabled={savingProvider === "coupang"}
                onClick={() =>
                  saveCredential("coupang", {
                    apiKey: coupangAccess,
                    secretKey: coupangSecret,
                  })
                }
                className="w-full py-2 rounded-lg bg-indigo-600 text-white font-semibold cursor-pointer hover:bg-indigo-500"
              >
                쿠팡 API 키 저장
              </button>
            </div>

            {/* Upstage */}
            <div
              className="p-4 rounded-xl border space-y-2.5"
              style={{
                backgroundColor: "var(--bg-elevated)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <div className="font-bold text-sm flex items-center justify-between">
                <span>Upstage Solar Pro 4</span>
                <span className="text-[10px] text-indigo-400">2단 타래 직조</span>
              </div>
              <input
                type="password"
                placeholder="UPSTAGE_API_KEY (console.upstage.ai)"
                value={upstageKey}
                onChange={(e) => setUpstageKey(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-xs"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-subtle)",
                }}
              />
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                페르소나 프롬프트 + 공정위 필수 문구 가드레일이 적용됩니다.
              </p>
              <button
                type="button"
                disabled={savingProvider === "upstage"}
                onClick={() =>
                  saveCredential("upstage", {
                    apiKey: upstageKey,
                  })
                }
                className="w-full py-2 rounded-lg bg-indigo-600 text-white font-semibold cursor-pointer hover:bg-indigo-500"
              >
                Upstage 키 저장
              </button>
            </div>

            {/* OpenAI */}
            <div
              className="p-4 rounded-xl border space-y-2.5"
              style={{
                backgroundColor: "var(--bg-elevated)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <div className="font-bold text-sm flex items-center justify-between">
                <span>OpenAI GPT-6-Luna</span>
                <span className="text-[10px] text-indigo-400">2단 타래 직조</span>
              </div>
              <input
                type="password"
                placeholder="OPENAI_API_KEY"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-xs"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-subtle)",
                }}
              />
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                페르소나 프롬프트 + 공정위 필수 문구 가드레일이 적용됩니다.
              </p>
              <button
                type="button"
                disabled={savingProvider === "openai"}
                onClick={() =>
                  saveCredential("openai", {
                    apiKey: openaiKey,
                  })
                }
                className="w-full py-2 rounded-lg bg-indigo-600 text-white font-semibold cursor-pointer hover:bg-indigo-500"
              >
                OpenAI 키 저장
              </button>
            </div>

            {/* Gemini */}
            <div
              className="p-4 rounded-xl border space-y-2.5"
              style={{
                backgroundColor: "var(--bg-elevated)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <div className="font-bold text-sm flex items-center justify-between">
                <span>Google Gemini LLM</span>
                <span className="text-[10px] text-indigo-400">2단 타래 직조</span>
              </div>
              <input
                type="password"
                placeholder="GEMINI_API_KEY (AI Studio)"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-xs"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-subtle)",
                }}
              />
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                페르소나 프롬프트 + 공정위 필수 문구 가드레일이 적용됩니다.
              </p>
              <button
                type="button"
                disabled={savingProvider === "gemini"}
                onClick={() =>
                  saveCredential("gemini", {
                    apiKey: geminiKey,
                  })
                }
                className="w-full py-2 rounded-lg bg-indigo-600 text-white font-semibold cursor-pointer hover:bg-indigo-500"
              >
                Gemini 키 저장
              </button>
            </div>

            {/* Meta Threads */}
            <div
              className="p-4 rounded-xl border space-y-2.5"
              style={{
                backgroundColor: "var(--bg-elevated)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <div className="font-bold text-sm flex items-center justify-between">
                <span>Meta Threads Graph API v1.0</span>
                <span className="text-[10px] text-indigo-400">타래 체이닝</span>
              </div>
              <input
                type="text"
                placeholder="Threads User ID (예: 254109281)"
                value={threadsUserId}
                onChange={(e) => setThreadsUserId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-xs"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-subtle)",
                }}
              />
              <input
                type="password"
                placeholder="Threads Access Token"
                value={threadsToken}
                onChange={(e) => setThreadsToken(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-xs"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-subtle)",
                }}
              />
              <button
                type="button"
                disabled={savingProvider === "threads"}
                onClick={() =>
                  saveCredential("threads", {
                    apiKey: threadsUserId,
                    accessToken: threadsToken,
                  })
                }
                className="w-full py-2 rounded-lg bg-indigo-600 text-white font-semibold cursor-pointer hover:bg-indigo-500"
              >
                Threads 토큰 저장
              </button>
            </div>

            {/* Naver DataLab */}
            <div
              className="p-4 rounded-xl border space-y-2.5"
              style={{
                backgroundColor: "var(--bg-elevated)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <div className="font-bold text-sm flex items-center justify-between">
                <span>네이버 데이터랩 쇼핑인사이트</span>
                <span className="text-[10px] text-indigo-400">TTL 1시간</span>
              </div>
              <input
                type="text"
                placeholder="X-Naver-Client-Id"
                value={naverId}
                onChange={(e) => setNaverId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-xs"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-subtle)",
                }}
              />
              <input
                type="password"
                placeholder="X-Naver-Client-Secret"
                value={naverSecret}
                onChange={(e) => setNaverSecret(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-xs"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-subtle)",
                }}
              />
              <button
                type="button"
                disabled={savingProvider === "naver"}
                onClick={() =>
                  saveCredential("naver", {
                    apiKey: naverId,
                    secretKey: naverSecret,
                  })
                }
                className="w-full py-2 rounded-lg bg-indigo-600 text-white font-semibold cursor-pointer hover:bg-indigo-500"
              >
                네이버 API 키 저장
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 text-xs" style={{ color: "var(--text-muted)" }}>
            <span className="flex items-center gap-1">
              <ExternalLink className="w-3.5 h-3.5" />
              배경(바깥 영역) 클릭 또는 ESC 키로 닫을 수 있습니다.
            </span>
            <form method="dialog">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg border font-semibold cursor-pointer"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                닫기
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </div>
  );
}
