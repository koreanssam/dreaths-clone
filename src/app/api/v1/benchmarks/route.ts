import { NextRequest, NextResponse } from "next/server";
import { createBenchmark, deleteBenchmark, listBenchmarks } from "@/db";

export async function GET() {
  return NextResponse.json({
    ok: true,
    benchmarks: listBenchmarks(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const authorHandle = String(body?.authorHandle || "@creator").trim();
    const category = String(body?.category || "생활/건강").trim();
    const hookText = String(body?.hookText || "").trim();
    const replyText = String(body?.replyText || "").trim();
    const notes = String(body?.notes || "").trim();

    if (!hookText) {
      return NextResponse.json(
        { ok: false, error: "본문(hookText) 내용을 입력해 주세요." },
        { status: 400 }
      );
    }

    const created = createBenchmark({
      authorHandle,
      category,
      hookText,
      replyText,
      likesCount: Number(body?.likesCount || 100),
      repliesCount: Number(body?.repliesCount || 20),
      notes,
    });

    return NextResponse.json({
      ok: true,
      benchmark: created,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "벤치마킹 아이템 저장에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "삭제할 ID가 필요합니다." },
      { status: 400 }
    );
  }
  deleteBenchmark(id);
  return NextResponse.json({ ok: true, id });
}
