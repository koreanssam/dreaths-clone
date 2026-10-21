"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Flame,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Newspaper,
  MessageSquareHeart,
  ArrowUpRight,
  Sparkles,
  Clock,
} from "lucide-react";
import {
  NAVER_CATEGORIES,
  type GoogleTrendItem,
  type HobbySpaceItem,
  type NaverCategoryCode,
  type NaverKeywordItem,
} from "@/types";

export default function InsightsDashboardPage() {
  const [selectedCategory, setSelectedCategory] =
    useState<NaverCategoryCode>("50000006");
  const [naverKeywords, setNaverKeywords] = useState<NaverKeywordItem[]>([]);
  const [googleItems, setGoogleItems] = useState<GoogleTrendItem[]>([]);
  const [hobbyItems, setHobbyItems] = useState<HobbySpaceItem[]>([]);
  const [hobbyFilter, setHobbyFilter] = useState<
    "all" | "ai_briefing" | "hotdeal" | "popular_post"
  >("all");
  const [cachedAt, setCachedAt] = useState<string>("");
  const [googleSource, setGoogleSource] = useState<string>("live_rss");
  const [loading, setLoading] = useState<boolean>(true);

  async function loadInsights(
    category: NaverCategoryCode,
    forceRefresh = false
  ) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/v1/trends/insights?category=${category}${
          forceRefresh ? "&refresh=1" : ""
        }`
      );
      const json = await res.json();
      if (json.ok) {
        setNaverKeywords(json.naver?.keywords || []);
        setGoogleItems(json.google?.items || []);
        setHobbyItems(json.hobbyspace?.items || []);
        setCachedAt(json.naver?.cachedAt || new Date().toISOString());
        setGoogleSource(json.google?.sourceMode || "live_rss");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInsights(selectedCategory, false);
  }, [selectedCategory]);

  const filteredHobbyItems =
    hobbyFilter === "all"
      ? hobbyItems
      : hobbyItems.filter((item) =>
          hobbyFilter === "popular_post"
            ? item.section === "popular_post" ||
              item.section === "popular_ranking"
            : item.section === hobbyFilter
        );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Flame className="w-4 h-4" />
            Real-time Trend Intelligence
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            트렌드 & 인사이트 대시보드
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            네이버 데이터랩 쇼핑인사이트(10대 카테고리), 구글 트렌드 급상승 RSS, 하비스페이스 핫딜/이슈를 통합 포착하고 원클릭으로 제휴 타래를 직조합니다.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {cachedAt && (
            <span
              className="text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-muted)",
              }}
            >
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              캐시 TTL 1h ({new Date(cachedAt).toLocaleTimeString("ko-KR")})
            </span>
          )}
          <button
            type="button"
            onClick={() => loadInsights(selectedCategory, true)}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-500 cursor-pointer disabled:opacity-50 shadow-sm"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
            실시간 새로고침
          </button>
        </div>
      </div>

      {/* Section 1: Naver DataLab Shopping Insight (10 Categories) */}
      <section
        className="rounded-2xl border p-5 sm:p-6 space-y-5 shadow-xs"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                네이버 데이터랩 쇼핑인사이트 TOP 키워드
              </h2>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                카테고리별 클릭 트렌드 급상승 쇼핑 키워드 · 클릭 시 쿠팡 상품 자동 매칭 에디터로 연결
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 w-fit">
            10종 카테고리 지원 · Redis/SQLite TTL 1시간
          </span>
        </div>

        {/* 10 Category Tabs */}
        <div className="flex flex-wrap gap-2">
          {NAVER_CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.code;
            return (
              <button
                key={cat.code}
                type="button"
                onClick={() => setSelectedCategory(cat.code)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  active
                    ? "bg-indigo-600 text-white border-indigo-500 shadow-xs"
                    : "hover:opacity-85"
                }`}
                style={
                  !active
                    ? {
                        backgroundColor: "var(--bg-elevated)",
                        borderColor: "var(--border-subtle)",
                        color: "var(--text-primary)",
                      }
                    : undefined
                }
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Keyword Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {naverKeywords.map((item) => (
            <div
              key={item.keyword}
              className="flex items-center justify-between p-3.5 rounded-xl border transition-all"
              style={{
                backgroundColor: "var(--bg-elevated)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`w-6 h-6 rounded-lg text-xs font-extrabold flex items-center justify-center shrink-0 ${
                    item.rank <= 3
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-500/20 text-zinc-400"
                  }`}
                >
                  {item.rank}
                </span>
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate flex items-center gap-2">
                    <span>{item.keyword}</span>
                    {item.change === "new" && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold">
                        NEW
                      </span>
                    )}
                    {item.change === "up" && (
                      <span className="text-[10px] text-emerald-400 font-bold">
                        ▲ 급상승
                      </span>
                    )}
                  </div>
                  {item.ratio != null && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-24 h-1.5 rounded-full bg-zinc-500/20 overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${Math.min(100, item.ratio)}%` }}
                      />
                    </div>
                    <span
                      className="text-[11px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      클릭지수 {item.ratio}
                    </span>
                  </div>
                  )}
                </div>
              </div>

              <Link
                href={`/write?keyword=${encodeURIComponent(
                  item.keyword
                )}&mode=affiliate`}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-indigo-600/15 text-indigo-400 hover:bg-indigo-600 hover:text-white text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                쿠팡 매칭 & 직조
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom 2 Columns: Google Trends RSS + HobbySpace Community */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Google Trends KR RSS */}
        <section
          className="rounded-2xl border p-5 sm:p-6 space-y-4"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold">
                  구글 트렌드 실시간 급상승 (KR)
                </h2>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  trends.google.co.kr/trending/rss?geo=KR 실시간 파싱
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-400">
              {googleSource === "live_rss" ? "LIVE RSS 연동됨" : "RSS 캐시"}
            </span>
          </div>

          <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
            {googleItems.slice(0, 10).map((g) => (
              <div
                key={`${g.rank}-${g.title}`}
                className="p-3.5 rounded-xl border space-y-2"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  borderColor: "var(--border-subtle)",
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-extrabold flex items-center justify-center shrink-0">
                      {g.rank}
                    </span>
                    <span className="font-bold text-sm truncate">{g.title}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-semibold shrink-0">
                      🔥 {g.approxTraffic}
                    </span>
                  </div>

                  <Link
                    href={`/write?keyword=${encodeURIComponent(g.title)}`}
                    className="shrink-0 px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 flex items-center gap-1"
                  >
                    직조
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>

                {g.newsItems.length > 0 && (
                  <div className="pl-8 space-y-1">
                    {g.newsItems.slice(0, 2).map((news, idx) => (
                      <a
                        key={idx}
                        href={news.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs hover:underline truncate"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <Newspaper className="w-3 h-3 shrink-0 text-blue-400" />
                        <span className="truncate">{news.title}</span>
                        {news.source && (
                          <span
                            className="text-[10px] shrink-0"
                            style={{ color: "var(--text-muted)" }}
                          >
                            ({news.source})
                          </span>
                        )}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* HobbySpace Community RSS & Popular Crawler */}
        <section
          className="rounded-2xl border p-5 sm:p-6 space-y-4"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center">
                <MessageSquareHeart className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold">
                  최근 뜨는 커뮤니티 조사 (하비스페이스)
                </h2>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  bbs.hobbyspace.org RSS 브리핑 · 실시간 쇼핑 핫딜 · 인기 랭킹
                </p>
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "all", label: "전체 피드" },
              { id: "ai_briefing", label: "🤖 AI 브리핑" },
              { id: "hotdeal", label: "🛒 쇼핑/핫딜 추천" },
              { id: "popular_post", label: "🔥 인기글/랭킹" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setHobbyFilter(
                    tab.id as
                      | "all"
                      | "ai_briefing"
                      | "hotdeal"
                      | "popular_post"
                  )
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border ${
                  hobbyFilter === tab.id
                    ? "bg-purple-600 text-white border-purple-500"
                    : ""
                }`}
                style={
                  hobbyFilter !== tab.id
                    ? {
                        backgroundColor: "var(--bg-elevated)",
                        borderColor: "var(--border-subtle)",
                      }
                    : undefined
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-3 max-h-[490px] overflow-y-auto pr-1">
            {filteredHobbyItems.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border space-y-2"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  borderColor: "var(--border-subtle)",
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          item.section === "hotdeal"
                            ? "bg-rose-500/15 text-rose-400"
                            : item.section === "ai_briefing"
                            ? "bg-indigo-500/15 text-indigo-400"
                            : "bg-purple-500/15 text-purple-400"
                        }`}
                      >
                        {item.section === "hotdeal"
                          ? "쇼핑/핫딜"
                          : item.section === "ai_briefing"
                          ? "AI 브리핑"
                          : "인기 토픽"}
                      </span>
                      {item.score && (
                        <span
                          className="text-[11px]"
                          style={{ color: "var(--text-muted)" }}
                        >
                          반응점수 {item.score}점
                        </span>
                      )}
                    </div>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-sm hover:underline block"
                    >
                      {item.title}
                    </a>
                    {item.summary && (
                      <p
                        className="text-xs line-clamp-2"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {item.summary}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      item.keywords || [
                        item.title
                          .replace(/\[[^\]]+\]/g, "")
                          .trim()
                          .split(" ")
                          .slice(0, 2)
                          .join(" "),
                      ]
                    ).map((kw) => (
                      <Link
                        key={kw}
                        href={`/write?keyword=${encodeURIComponent(kw)}`}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-400 hover:bg-indigo-600 hover:text-white font-semibold transition-colors"
                      >
                        #{kw} 에디터로 직조 →
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
