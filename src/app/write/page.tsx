"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  PenTool,
  Search,
  Link2,
  Sparkles,
  Send,
  CalendarClock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Rocket,
  Layers,
} from "lucide-react";
import {
  FTC_AFFILIATE_DISCLAIMER,
  WEAVE_MODELS,
  type WeaveModelId,
  type CoupangProduct,
  type Persona,
  type WritingMode,
} from "@/types";
import type { ThreadsPublishStepLog } from "@/services/threads";

function SmartEditorContent() {
  const searchParams = useSearchParams();
  const initialKeyword = searchParams.get("keyword") || "수비드 닭가슴살";
  const initialMode =
    (searchParams.get("mode") as WritingMode) || "affiliate";
  const initialPersona =
    searchParams.get("personaId") || "persona-heymongle";
  const initialHook = searchParams.get("hookText") || "";
  const initialReply = searchParams.get("replyText") || "";

  const [mode, setMode] = useState<WritingMode>(initialMode);
  const [keyword, setKeyword] = useState<string>(initialKeyword);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] =
    useState<string>(initialPersona);
  const [customInstruction, setCustomInstruction] = useState<string>("");

  // Coupang Product & Deeplink state
  const [products, setProducts] = useState<CoupangProduct[]>([]);
  const [selectedProduct, setSelectedProduct] =
    useState<CoupangProduct | null>(null);
  const [shortenUrl, setShortenUrl] = useState<string>("");
  const [hmacHeaderPreview, setHmacHeaderPreview] = useState<string>("");
  const [searchingProducts, setSearchingProducts] = useState<boolean>(false);
  const [creatingDeeplink, setCreatingDeeplink] = useState<boolean>(false);

  // 2-Stage Thread Weave state
  const [threadBody1, setThreadBody1] = useState<string>(initialHook);
  const [threadBody2, setThreadBody2] = useState<string>(initialReply);
  const [weaving, setWeaving] = useState<boolean>(false);
  const [modelUsed, setModelUsed] = useState<string>("");
  const [weaveModel, setWeaveModel] = useState<WeaveModelId>("solar-pro4");
  const [keyStatus, setKeyStatus] = useState<
    Record<string, { configured: boolean; apiKeyPreview: string }>
  >({});
  const [quickKey, setQuickKey] = useState<string>("");
  const [savingKey, setSavingKey] = useState<boolean>(false);

  // Publishing & Scheduling state
  const [publishing, setPublishing] = useState<boolean>(false);
  const [publishSteps, setPublishSteps] = useState<ThreadsPublishStepLog[]>([]);
  const [scheduleTime, setScheduleTime] = useState<string>(() => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return tomorrow.toISOString().slice(0, 16);
  });
  const [statusBanner, setStatusBanner] = useState<{
    type: "success" | "info";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/v1/personas")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok && Array.isArray(json.personas)) {
          setPersonas(json.personas);
        }
      });
  }, []);

  async function fetchKeyStatus() {
    try {
      const res = await fetch("/api/v1/accounts");
      const json = await res.json();
      if (json.ok) setKeyStatus(json.status || {});
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchKeyStatus();
  }, []);

  const activeModel = WEAVE_MODELS.find((m) => m.id === weaveModel)!;
  const activeKeyLive = Boolean(keyStatus[activeModel.provider]?.configured);

  async function handleSaveQuickKey() {
    if (!quickKey.trim()) return;
    setSavingKey(true);
    try {
      const res = await fetch("/api/v1/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: activeModel.provider,
          apiKey: quickKey,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setQuickKey("");
        await fetchKeyStatus();
        setStatusBanner({
          type: "success",
          text: `${activeModel.label} API 키가 저장되었습니다.`,
        });
      }
    } finally {
      setSavingKey(false);
    }
  }

  useEffect(() => {
    if (initialKeyword) {
      handleSearchCoupang(initialKeyword);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearchCoupang(targetKw = keyword) {
    if (!targetKw.trim()) return;
    setSearchingProducts(true);
    try {
      const res = await fetch("/api/v1/coupang/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: targetKw, limit: 6 }),
      });
      const json = await res.json();
      if (json.ok && Array.isArray(json.products)) {
        setProducts(json.products);
        setHmacHeaderPreview(json.authPreview || "");
        if (json.products.length > 0) {
          await handleSelectProduct(json.products[0]);
        }
      }
    } finally {
      setSearchingProducts(false);
    }
  }

  async function handleSelectProduct(product: CoupangProduct) {
    setSelectedProduct(product);
    setCreatingDeeplink(true);
    try {
      const res = await fetch("/api/v1/coupang/deeplink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coupangUrls: [product.productUrl] }),
      });
      const json = await res.json();
      if (json.ok) {
        setShortenUrl(json.shortenUrl || "");
        if (json.authPreview) setHmacHeaderPreview(json.authPreview);
      }
    } finally {
      setCreatingDeeplink(false);
    }
  }

  async function handleWeave() {
    setWeaving(true);
    setStatusBanner(null);
    try {
      const res = await fetch("/api/v1/editor/weave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: weaveModel,
          mode,
          personaId: selectedPersonaId,
          keyword,
          customInstruction,
          product: selectedProduct
            ? {
                productId: selectedProduct.productId,
                productName: selectedProduct.productName,
                productPrice: selectedProduct.productPrice,
                productUrl: selectedProduct.productUrl,
                shortenUrl,
              }
            : undefined,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setThreadBody1(json.threadBody1);
        setThreadBody2(json.threadBody2);
        setModelUsed(json.modelUsed || weaveModel);
        setStatusBanner({
          type: "info",
          text: "2단 타래 원고 직조 및 공정위 심의 문구·외부링크 분리 가드레일이 적용되었습니다.",
        });
      }
    } finally {
      setWeaving(false);
    }
  }

  async function handlePublishNow() {
    if (!threadBody1.trim()) return;
    setPublishing(true);
    setPublishSteps([]);
    try {
      const res = await fetch("/api/v1/threads/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personaId: selectedPersonaId,
          mode,
          targetKeyword: keyword,
          coupangProductId: selectedProduct?.productId || null,
          coupangDeeplink: shortenUrl || null,
          threadBody1,
          threadBody2,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setPublishSteps(json.steps || []);
        setStatusBanner({
          type: "success",
          text: `Meta Threads 2단 연쇄 발행 완료! (본문 ID: ${json.post.threadExternalId1} → 첫 댓글 타래 ID: ${json.post.threadExternalId2})`,
        });
      }
    } finally {
      setPublishing(false);
    }
  }

  async function handleSchedule() {
    if (!threadBody1.trim()) return;
    setPublishing(true);
    try {
      const res = await fetch("/api/v1/threads/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personaId: selectedPersonaId,
          mode,
          targetKeyword: keyword,
          coupangProductId: selectedProduct?.productId || null,
          coupangDeeplink: shortenUrl || null,
          threadBody1,
          threadBody2,
          scheduledAt: new Date(scheduleTime).toISOString(),
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setStatusBanner({
          type: "success",
          text: `예약 발행 등록 완료! (${new Date(
            json.post.scheduledAt
          ).toLocaleString("ko-KR")}에 본문 + 타래 자동 연쇄 발행 예정)`,
        });
      }
    } finally {
      setPublishing(false);
    }
  }

  const hasExternalLinkInBody1 = /https?:\/\//i.test(threadBody1);
  const hasFtcDisclaimerInBody2 = threadBody2.includes(
    FTC_AFFILIATE_DISCLAIMER
  );
  const isBody1LengthOk = threadBody1.length <= 500;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <PenTool className="w-4 h-4" />
            Smart 2-Stage Thread Weaver & Affiliate Publisher
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            스마트 에디터 & AI 직조 엔진
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Threads 도달률 페널티를 방지하는 2-Stage 분할 아키텍처 (1번 본문 후킹 + 1번 댓글 쿠팡 숏링크 & 공정위 필수 고지)
          </p>
        </div>
      </div>

      {statusBanner && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 ${
            statusBanner.type === "success"
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
              : "bg-indigo-500/15 border-indigo-500/30 text-indigo-400"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusBanner.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration, Coupang Search & Persona Selection */}
        <div className="lg:col-span-6 space-y-6">
          {/* 1. Mode & Keyword */}
          <div
            className="rounded-2xl border p-5 space-y-4"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center">
                  1
                </span>
                작성 모드 & 타겟 키워드
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setMode("affiliate")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === "affiliate"
                    ? "bg-indigo-600 text-white border-indigo-500"
                    : ""
                }`}
                style={
                  mode !== "affiliate"
                    ? {
                        backgroundColor: "var(--bg-elevated)",
                        borderColor: "var(--border-subtle)",
                      }
                    : undefined
                }
              >
                <div className="text-xs font-bold">
                  🛒 쿠팡파트너스 제휴마케팅
                </div>
                <div
                  className={`text-[11px] mt-0.5 ${
                    mode === "affiliate" ? "text-indigo-100" : ""
                  }`}
                  style={
                    mode !== "affiliate"
                      ? { color: "var(--text-muted)" }
                      : undefined
                  }
                >
                  본문 후킹 + 1번 댓글 숏링크/공정위 문구
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode("general")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === "general"
                    ? "bg-indigo-600 text-white border-indigo-500"
                    : ""
                }`}
                style={
                  mode !== "general"
                    ? {
                        backgroundColor: "var(--bg-elevated)",
                        borderColor: "var(--border-subtle)",
                      }
                    : undefined
                }
              >
                <div className="text-xs font-bold">💡 간편/전문성 글작성</div>
                <div
                  className={`text-[11px] mt-0.5 ${
                    mode === "general" ? "text-indigo-100" : ""
                  }`}
                  style={
                    mode !== "general"
                      ? { color: "var(--text-muted)" }
                      : undefined
                  }
                >
                  제휴 링크 없이 순수 인사이트/정보 전달
                </div>
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearchCoupang(keyword);
                }}
                placeholder="트렌드 키워드 입력 (예: 수비드 닭가슴살, 타일 줄눈 코팅제)"
                className="flex-1 px-3.5 py-2.5 rounded-xl border text-sm"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  borderColor: "var(--border-subtle)",
                }}
              />
              <button
                type="button"
                onClick={() => handleSearchCoupang(keyword)}
                disabled={searchingProducts}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-500 cursor-pointer shrink-0"
              >
                <Search className="w-3.5 h-3.5" />
                {searchingProducts ? "검색 중..." : "쿠팡 상품 검색"}
              </button>
            </div>
          </div>

          {/* 2. Coupang Product Mapping & Deeplink */}
          {mode === "affiliate" && (
            <div
              className="rounded-2xl border p-5 space-y-4"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center">
                    2
                  </span>
                  쿠팡 파트너스 상품 선택 & 딥링크 발급
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-semibold">
                  HMAC-SHA256 서명 검증됨
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                {products.map((prod) => {
                  const isSelected =
                    selectedProduct?.productId === prod.productId;
                  return (
                    <button
                      key={prod.productId}
                      type="button"
                      onClick={() => handleSelectProduct(prod)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                        isSelected
                          ? "border-indigo-500 ring-2 ring-indigo-500/30"
                          : ""
                      }`}
                      style={{
                        backgroundColor: "var(--bg-elevated)",
                        borderColor: isSelected
                          ? "#6366f1"
                          : "var(--border-subtle)",
                      }}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-400">
                            ID: {prod.productId}
                          </span>
                          {prod.isRocket && (
                            <span className="text-[10px] font-bold text-sky-400 flex items-center gap-0.5">
                              <Rocket className="w-3 h-3" /> 로켓배송
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-bold line-clamp-2">
                          {prod.productName}
                        </div>
                      </div>
                      <div className="text-sm font-extrabold text-indigo-400">
                        {prod.productPrice.toLocaleString()}원
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Issued Tracking Shortlink */}
              <div
                className="p-3.5 rounded-xl border space-y-2"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  borderColor: "var(--border-subtle)",
                }}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-indigo-400" />
                    발급된 쿠팡 파트너스 트래킹 숏링크 (shortenUrl)
                  </span>
                  {creatingDeeplink && (
                    <span className="text-[11px] text-amber-400">
                      딥링크 발급 중...
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shortenUrl}
                    onChange={(e) => setShortenUrl(e.target.value)}
                    placeholder="https://link.coupang.com/a/..."
                    className="flex-1 px-3 py-1.5 rounded-lg border text-xs font-mono"
                    style={{
                      backgroundColor: "var(--bg-surface)",
                      borderColor: "var(--border-subtle)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(shortenUrl)}
                    className="px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    style={{
                      backgroundColor: "var(--bg-surface)",
                      borderColor: "var(--border-subtle)",
                    }}
                  >
                    <Copy className="w-3 h-3" />
                    복사
                  </button>
                </div>
                {hmacHeaderPreview && (
                  <div
                    className="text-[10px] font-mono truncate"
                    style={{ color: "var(--text-muted)" }}
                    title={hmacHeaderPreview}
                  >
                    Auth: {hmacHeaderPreview}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. Persona Selection & Weave Trigger */}
          <div
            className="rounded-2xl border p-5 space-y-4"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <h2 className="text-sm font-bold flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center">
                3
              </span>
              페르소나 프리셋 주입 & AI 2단 타래 직조
            </h2>

            <div className="space-y-2">
              <label className="text-xs font-semibold block">
                직조 LLM 모델 선택
              </label>
              <div
                role="tablist"
                className="grid grid-cols-1 sm:grid-cols-3 gap-2"
              >
                {WEAVE_MODELS.map((m) => {
                  const selected = m.id === weaveModel;
                  const live = Boolean(keyStatus[m.provider]?.configured);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setWeaveModel(m.id)}
                      className={`p-3 rounded-xl border text-left cursor-pointer space-y-1 ${
                        selected ? "ring-2 ring-indigo-500" : ""
                      }`}
                      style={{
                        backgroundColor: "var(--bg-elevated)",
                        borderColor: selected
                          ? "rgb(99 102 241)"
                          : "var(--border-subtle)",
                      }}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold">{m.label}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            live
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-amber-500/15 text-amber-400"
                          }`}
                        >
                          {live ? "LIVE" : "AUTO"}
                        </span>
                      </div>
                      <p
                        className="text-[11px]"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {m.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div
                className="p-3 rounded-xl border space-y-2"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  borderColor: "var(--border-subtle)",
                }}
              >
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {activeKeyLive
                    ? `${activeModel.label} 연동됨 (LIVE) — 키: ${
                        keyStatus[activeModel.provider]?.apiKeyPreview || "env"
                      }. 아래에서 키를 교체할 수 있습니다.`
                    : `${activeModel.label} 키 미연동 (AUTO) — 페르소나 폴백 엔진으로 직조됩니다. 키를 입력하면 실제 모델이 호출됩니다.`}
                </p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={quickKey}
                    onChange={(e) => setQuickKey(e.target.value)}
                    placeholder={`${activeModel.label} API Key`}
                    className="flex-1 min-w-0 px-3 py-2 rounded-lg border text-xs"
                    style={{
                      backgroundColor: "var(--bg-surface)",
                      borderColor: "var(--border-subtle)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSaveQuickKey}
                    disabled={savingKey || !quickKey.trim()}
                    className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {savingKey ? "저장 중..." : "키 저장"}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold block">
                적용할 페르소나 선택
              </label>
              <select
                value={selectedPersonaId}
                onChange={(e) => setSelectedPersonaId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  borderColor: "var(--border-subtle)",
                }}
              >
                {personas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.isDefault ? "[기본] " : "[커스텀] "}
                    {p.name} — ({p.tone})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold block">
                사용자 맞춤 추가 지침 (선택)
              </label>
              <input
                type="text"
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                placeholder="예: 성시경 레시피 스타일로 강조해줘 / 자취생 공감 포인트 넣어줘"
                className="w-full px-3.5 py-2 rounded-xl border text-xs"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  borderColor: "var(--border-subtle)",
                }}
              />
            </div>

            <button
              type="button"
              onClick={handleWeave}
              disabled={weaving}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {weaving
                ? "페르소나 스타일로 2단 타래 직조 중..."
                : `${activeModel.label} 2-Stage 멀티 스레드 원고 직조하기`}
            </button>
          </div>
        </div>

        {/* Right Column: 2-Stage Thread Editor, Compliance Guardrail & Graph API Publisher */}
        <div className="lg:col-span-6 space-y-6">
          <div
            className="rounded-2xl border p-5 space-y-5"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold">
                  Threads 2-Stage 타래 분할 에디터
                </h2>
              </div>
              {modelUsed && (
                <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-400 font-mono">
                  Engine: {modelUsed}
                </span>
              )}
            </div>

            {/* Thread 1: Main Post */}
            <div
              className="p-4 rounded-xl border space-y-2.5"
              style={{
                backgroundColor: "var(--bg-elevated)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[10px]">
                    Thread 1
                  </span>
                  본문 후킹 & 경험담 (외부 링크 미포함 · 도달률 보호)
                </span>
                <span
                  className={`text-xs font-mono font-bold ${
                    isBody1LengthOk ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {threadBody1.length} / 500자
                </span>
              </div>

              <textarea
                rows={7}
                value={threadBody1}
                onChange={(e) => setThreadBody1(e.target.value)}
                placeholder="위에서 [2-Stage 멀티 스레드 원고 직조하기] 버튼을 누르거나 직접 본문을 작성하세요."
                className="w-full p-3 rounded-xl border text-xs leading-relaxed resize-y"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-subtle)",
                }}
              />

              <div className="flex items-center justify-between text-[11px]">
                {hasExternalLinkInBody1 ? (
                  <span className="text-rose-400 flex items-center gap-1 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    주의: 1번 본문에 외부 링크가 있으면 스레드 노출 도달률이 하락합니다!
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    도달률 보호 통과: 본문 내 외부 링크 없음
                  </span>
                )}
              </div>
            </div>

            {/* Thread 2: First Reply */}
            <div
              className="p-4 rounded-xl border space-y-2.5"
              style={{
                backgroundColor: "var(--bg-elevated)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-purple-600 text-white text-[10px]">
                    Thread 2 (첫 댓글 타래)
                  </span>
                  구매 딥링크 & 공정위 필수 고지 문구
                </span>
                {mode === "affiliate" && !hasFtcDisclaimerInBody2 && (
                  <button
                    type="button"
                    onClick={() =>
                      setThreadBody2(
                        (prev) =>
                          `${prev.trim()}\n\n${FTC_AFFILIATE_DISCLAIMER}`.trim()
                      )
                    }
                    className="text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold cursor-pointer"
                  >
                    + 공정위 문구 자동 삽입
                  </button>
                )}
              </div>

              <textarea
                rows={5}
                value={threadBody2}
                onChange={(e) => setThreadBody2(e.target.value)}
                placeholder="첫 번째 댓글 타래로 자동 연결(reply_to_id)될 내용입니다."
                className="w-full p-3 rounded-xl border text-xs leading-relaxed resize-y"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-subtle)",
                }}
              />

              {mode === "affiliate" && (
                <div className="flex items-center justify-between text-[11px]">
                  {hasFtcDisclaimerInBody2 ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      공정거래위원회 추천보증심사 지침 표준 문구 포함됨
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      공정위 수수료 고지 문구가 누락되었습니다. 우측 상단 버튼으로 삽입하세요.
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Publish & Schedule Controls */}
            <div className="pt-2 space-y-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handlePublishNow}
                  disabled={publishing || !threadBody1.trim()}
                  className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {publishing
                    ? "Threads 발행 중..."
                    : "Threads 즉시 연쇄 발행 (본문+타래)"}
                </button>

                <div className="flex gap-2">
                  <input
                    type="datetime-local"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="flex-1 px-2.5 py-2 rounded-xl border text-xs"
                    style={{
                      backgroundColor: "var(--bg-elevated)",
                      borderColor: "var(--border-subtle)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSchedule}
                    disabled={publishing || !threadBody1.trim()}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    <CalendarClock className="w-3.5 h-3.5" />
                    예약
                  </button>
                </div>
              </div>

              {/* Meta Graph API v1.0 Pipeline Execution Logs */}
              {publishSteps.length > 0 && (
                <div
                  className="p-3.5 rounded-xl border space-y-2 text-xs"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    borderColor: "var(--border-subtle)",
                  }}
                >
                  <div className="font-bold text-indigo-400">
                    Meta Threads Graph API (v1.0) 비동기 Container 파이프라인 실행 로그
                  </div>
                  <div className="space-y-1 font-mono text-[11px]">
                    {publishSteps.map((s, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="truncate">
                          {idx + 1}. [{s.step}] → ID: {s.id}
                        </span>
                        <span className="text-emerald-400 uppercase shrink-0">
                          {s.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SmartEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm">스마트 에디터 로딩 중...</div>
      }
    >
      <SmartEditorContent />
    </Suspense>
  );
}
