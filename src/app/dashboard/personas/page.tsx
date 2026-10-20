"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Trash2,
  Sparkles,
  MessageSquareQuote,
  Ban,
  CheckCircle2,
} from "lucide-react";
import type { Persona } from "@/types";

export default function PersonasPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [name, setName] = useState("");
  const [tone, setTone] = useState("");
  const [promptInstruction, setPromptInstruction] = useState("");
  const [example1, setExample1] = useState("");
  const [example2, setExample2] = useState("");
  const [forbiddenInput, setForbiddenInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function loadPersonas() {
    const res = await fetch("/api/v1/personas");
    const json = await res.json();
    if (json.ok) {
      setPersonas(json.personas || []);
    }
  }

  useEffect(() => {
    loadPersonas();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !tone.trim() || !promptInstruction.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/v1/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          tone,
          promptInstruction,
          fewShotExamples: [example1, example2].filter((s) => s.trim()),
          forbiddenWords: forbiddenInput
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setName("");
        setTone("");
        setPromptInstruction("");
        setExample1("");
        setExample2("");
        setForbiddenInput("");
        setToast(`'${json.persona.name}' 커스텀 페르소나가 등록되었습니다.`);
        setTimeout(() => setToast(null), 3000);
        await loadPersonas();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/v1/personas?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (json.ok) {
      await loadPersonas();
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Users className="w-4 h-4" />
          Persona Storage & Style Presets
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          페르소나 관리 스토리지
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          DREATHS 기본 내장 페르소나 4종(Hey Mongle, 팩폭 코치, 성시경/홍진경 맛도리, 뉴스 배달부) 및 나만의 커스텀 말투·예시 문장(Few-shot)·금지어를 관리합니다.
        </p>
      </div>

      {toast && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Persona Cards List */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-base font-bold">
            등록된 페르소나 프리셋 ({personas.length}개)
          </h2>

          <div className="space-y-4">
            {personas.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border p-5 space-y-3.5"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-subtle)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          p.isDefault
                            ? "bg-indigo-500/15 text-indigo-400"
                            : "bg-emerald-500/15 text-emerald-400"
                        }`}
                      >
                        {p.isDefault ? "DREATHS 기본 내장" : "사용자 커스텀"}
                      </span>
                      <span
                        className="text-xs font-semibold"
                        style={{ color: "var(--text-muted)" }}
                      >
                        어조: {p.tone}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold mt-1">{p.name}</h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/write?personaId=${encodeURIComponent(p.id)}`}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />이 페르소나로 직조
                    </Link>
                    {!p.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        className="p-2 rounded-xl border text-rose-400 hover:bg-rose-500/15 cursor-pointer"
                        style={{ borderColor: "var(--border-subtle)" }}
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <p
                  className="text-xs leading-relaxed p-3 rounded-xl border"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {p.promptInstruction}
                </p>

                {p.fewShotExamples.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold flex items-center gap-1 text-indigo-400">
                      <MessageSquareQuote className="w-3.5 h-3.5" />
                      Few-shot 예시 문장
                    </div>
                    {p.fewShotExamples.map((ex, i) => (
                      <div
                        key={i}
                        className="text-xs italic pl-3 border-l-2 border-indigo-500/50"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        &ldquo;{ex}&rdquo;
                      </div>
                    ))}
                  </div>
                )}

                {p.forbiddenWords.length > 0 && (
                  <div className="flex items-center flex-wrap gap-1.5 pt-1">
                    <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1 mr-1">
                      <Ban className="w-3 h-3" /> 금지 단어:
                    </span>
                    {p.forbiddenWords.map((word) => (
                      <span
                        key={word}
                        className="text-[11px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Custom Persona Creation Form */}
        <div className="lg:col-span-5">
          <form
            onSubmit={handleCreate}
            className="rounded-2xl border p-5 sm:p-6 space-y-4 sticky top-6"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" />
              <h2 className="text-base font-bold">
                신규 커스텀 페르소나 등록 (Custom CRUD)
              </h2>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold block">
                페르소나 명칭 *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 자취 10년차 살림 만렙 언니"
                className="w-full px-3.5 py-2 rounded-xl border text-xs"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  borderColor: "var(--border-subtle)",
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold block">
                어조 및 말투 요약 *
              </label>
              <input
                type="text"
                required
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                placeholder="예: 다정하지만 가성비 따질 땐 냉철한 반존대"
                className="w-full px-3.5 py-2 rounded-xl border text-xs"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  borderColor: "var(--border-subtle)",
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold block">
                시스템 프롬프트 상세 지침 (Prompt Instruction) *
              </label>
              <textarea
                rows={4}
                required
                value={promptInstruction}
                onChange={(e) => setPromptInstruction(e.target.value)}
                placeholder="Gemini가 원고를 직조할 때 따를 문장 호흡, 이모지 빈도, 후킹 스타일을 구체적으로 적어주세요."
                className="w-full p-3 rounded-xl border text-xs"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  borderColor: "var(--border-subtle)",
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold block">
                예시 문장 (Few-shot Examples)
              </label>
              <input
                type="text"
                value={example1}
                onChange={(e) => setExample1(e.target.value)}
                placeholder="예시 문장 1: 자취방 공간 좁다고 수납장 사지 마세요. 이거 하나면 끝나요."
                className="w-full px-3.5 py-2 rounded-xl border text-xs"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  borderColor: "var(--border-subtle)",
                }}
              />
              <input
                type="text"
                value={example2}
                onChange={(e) => setExample2(e.target.value)}
                placeholder="예시 문장 2: 만 원짜리 하나로 원룸 분위기 바꾸는 치트키 공유할게!"
                className="w-full px-3.5 py-2 rounded-xl border text-xs"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  borderColor: "var(--border-subtle)",
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold block">
                금지 단어 목록 (쉼표로 구분)
              </label>
              <input
                type="text"
                value={forbiddenInput}
                onChange={(e) => setForbiddenInput(e.target.value)}
                placeholder="예: 안녕하세요, 소개합니다, 강추"
                className="w-full px-3.5 py-2 rounded-xl border text-xs"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  borderColor: "var(--border-subtle)",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-sm"
            >
              {saving ? "저장 중..." : "신규 페르소나 스토리지에 추가"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
