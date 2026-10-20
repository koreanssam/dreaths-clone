"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookmarkCheck,
  Heart,
  MessageCircle,
  Sparkles,
  Plus,
  Trash2,
  Send,
  CalendarClock,
  CheckCircle2,
} from "lucide-react";
import type { BenchmarkItem, PostRecord } from "@/types";

export default function BenchmarkAndHistoryPage() {
  const [benchmarks, setBenchmarks] = useState<BenchmarkItem[]>([]);
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [authorHandle, setAuthorHandle] = useState("@viral_threads");
  const [category, setCategory] = useState("생활/건강");
  const [hookText, setHookText] = useState("");
  const [replyText, setReplyText] = useState("");
  const [notes, setNotes] = useState("");

  async function loadData() {
    const [bRes, pRes] = await Promise.all([
      fetch("/api/v1/benchmarks"),
      fetch("/api/v1/threads/publish"),
    ]);
    const bJson = await bRes.json();
    const pJson = await pRes.json();
    if (bJson.ok) setBenchmarks(bJson.benchmarks || []);
    if (pJson.ok) setPosts(pJson.posts || []);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAddBenchmark(e: React.FormEvent) {
    e.preventDefault();
    if (!hookText.trim()) return;
    const res = await fetch("/api/v1/benchmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authorHandle,
        category,
        hookText,
        replyText,
        notes,
        likesCount: 540,
        repliesCount: 88,
      }),
    });
    const json = await res.json();
    if (json.ok) {
      setHookText("");
      setReplyText("");
      setNotes("");
      await loadData();
    }
  }

  async function handleDeleteBenchmark(id: string) {
    await fetch(`/api/v1/benchmarks?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    await loadData();
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
          <BookmarkCheck className="w-4 h-4" />
          Viral Benchmark Vault & Publishing Queue
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          벤치마킹 보관함 & 스레드 발행 내역
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          전환율이 검증된 2단 타래 레퍼런스를 보관·복제하고, Meta Threads Graph API로 즉시 발행되거나 예약된 포스트 히스토리를 확인합니다.
        </p>
      </div>

      {/* Section 1: Benchmark Vault */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-base font-bold">
            바이럴 타래 벤치마킹 보관함 ({benchmarks.length}건)
          </h2>

          <div className="space-y-4">
            {benchmarks.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border p-5 space-y-3"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-subtle)",
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-indigo-400">
                      {item.authorHandle}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-400 font-semibold">
                      {item.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/write?keyword=${encodeURIComponent(
                        item.category
                      )}&hookText=${encodeURIComponent(
                        item.hookText
                      )}&replyText=${encodeURIComponent(item.replyText)}`}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      에디터로 복제
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDeleteBenchmark(item.id)}
                      className="p-1.5 rounded-lg border text-rose-400 hover:bg-rose-500/15 cursor-pointer"
                      style={{ borderColor: "var(--border-subtle)" }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div
                  className="p-3 rounded-xl border text-xs whitespace-pre-line leading-relaxed"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    borderColor: "var(--border-subtle)",
                  }}
                >
                  <div className="text-[10px] font-bold text-indigo-400 mb-1">
                    [Thread 1 - 본문 후킹]
                  </div>
                  {item.hookText}
                </div>

                {item.replyText && (
                  <div
                    className="p-3 rounded-xl border text-xs whitespace-pre-line leading-relaxed"
                    style={{
                      backgroundColor: "var(--bg-elevated)",
                      borderColor: "var(--border-subtle)",
                    }}
                  >
                    <div className="text-[10px] font-bold text-purple-400 mb-1">
                      [Thread 2 - 첫 댓글 딥링크 & 공정위 문구]
                    </div>
                    {item.replyText}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs pt-1" style={{ color: "var(--text-muted)" }}>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-rose-400" />
                      {item.likesCount.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5 text-blue-400" />
                      {item.repliesCount.toLocaleString()}
                    </span>
                  </div>
                  {item.notes && (
                    <span className="text-[11px] font-semibold text-emerald-400">
                      💡 {item.notes}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Benchmark Form */}
        <div className="lg:col-span-5">
          <form
            onSubmit={handleAddBenchmark}
            className="rounded-2xl border p-5 space-y-3.5"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <div className="flex items-center gap-2 font-bold text-base">
              <Plus className="w-4 h-4 text-indigo-400" />
              바이럴 레퍼런스 추가 보관
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="text"
                value={authorHandle}
                onChange={(e) => setAuthorHandle(e.target.value)}
                placeholder="@계정핸들"
                className="px-3 py-2 rounded-xl border text-xs"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  borderColor: "var(--border-subtle)",
                }}
              />
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="카테고리 (예: 식품)"
                className="px-3 py-2 rounded-xl border text-xs"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  borderColor: "var(--border-subtle)",
                }}
              />
            </div>

            <textarea
              rows={4}
              required
              value={hookText}
              onChange={(e) => setHookText(e.target.value)}
              placeholder="1번 본문(후킹 원고) 내용을 붙여넣으세요..."
              className="w-full p-3 rounded-xl border text-xs"
              style={{
                backgroundColor: "var(--bg-elevated)",
                borderColor: "var(--border-subtle)",
              }}
            />

            <textarea
              rows={3}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="2번 첫 댓글(타래 링크 유도) 내용을 붙여넣으세요..."
              className="w-full p-3 rounded-xl border text-xs"
              style={{
                backgroundColor: "var(--bg-elevated)",
                borderColor: "var(--border-subtle)",
              }}
            />

            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="분석 메모 (예: 가격 비교 후킹으로 댓글 유도)"
              className="w-full px-3 py-2 rounded-xl border text-xs"
              style={{
                backgroundColor: "var(--bg-elevated)",
                borderColor: "var(--border-subtle)",
              }}
            />

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer"
            >
              벤치마킹 보관함에 저장
            </button>
          </form>
        </div>
      </div>

      {/* Section 2: Published & Scheduled Posts Queue (POSTS Table) */}
      <section
        className="rounded-2xl border p-5 sm:p-6 space-y-4"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold">
              스레드 발행 & 예약 히스토리 (POSTS 테이블)
            </h2>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              스마트 에디터에서 즉시 연쇄 발행되었거나 예약 등록된 2단 타래 목록입니다.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-400">
            총 {posts.length}건
          </span>
        </div>

        {posts.length === 0 ? (
          <div
            className="p-8 rounded-xl border text-center text-xs"
            style={{
              backgroundColor: "var(--bg-elevated)",
              borderColor: "var(--border-subtle)",
              color: "var(--text-muted)",
            }}
          >
            아직 발행되거나 예약된 스레드가 없습니다. 스마트 에디터(/write)에서 첫 2단 타래를 발행해 보세요!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="p-4 rounded-xl border space-y-2.5"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  borderColor: "var(--border-subtle)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-indigo-400">
                    #{post.targetKeyword}
                  </span>
                  {post.status === "published" ? (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      발행 완료 (ID: {post.threadExternalId1})
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 flex items-center gap-1">
                      <CalendarClock className="w-3 h-3" />
                      예약됨 (
                      {post.scheduledAt
                        ? new Date(post.scheduledAt).toLocaleString("ko-KR")
                        : ""}
                      )
                    </span>
                  )}
                </div>

                <p className="text-xs line-clamp-3 whitespace-pre-line">
                  {post.threadBody1}
                </p>

                {post.coupangDeeplink && (
                  <div className="text-[11px] font-mono text-purple-400 truncate flex items-center gap-1">
                    <Send className="w-3 h-3 shrink-0" />
                    타래 딥링크: {post.coupangDeeplink}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
