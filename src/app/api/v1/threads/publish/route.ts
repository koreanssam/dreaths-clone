import { NextRequest, NextResponse } from "next/server";
import { listPosts } from "@/db";
import { ThreadsGraphClient } from "@/services/threads";
import type { WritingMode } from "@/types";

export async function GET() {
  try {
    const posts = listPosts();
    return NextResponse.json({
      ok: true,
      posts,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Failed to list posts",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const threadBody1 = String(body?.threadBody1 || "").trim();
    const threadBody2 = String(body?.threadBody2 || "").trim();

    if (!threadBody1) {
      return NextResponse.json(
        { ok: false, error: "1번 본문(threadBody1) 내용이 비어 있습니다." },
        { status: 400 }
      );
    }

    const client = new ThreadsGraphClient();
    const result = await client.publishChainedThread({
      personaId: String(body?.personaId || "persona-heymongle"),
      mode: (body?.mode as WritingMode) || "affiliate",
      targetKeyword: String(body?.targetKeyword || "트렌드 추천"),
      coupangProductId: body?.coupangProductId
        ? String(body.coupangProductId)
        : null,
      coupangDeeplink: body?.coupangDeeplink
        ? String(body.coupangDeeplink)
        : null,
      threadBody1,
      threadBody2,
    });

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "스레드 연쇄 발행 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
