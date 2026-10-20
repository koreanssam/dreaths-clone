import { NextRequest, NextResponse } from "next/server";
import { scheduleChainedThread } from "@/services/threads";
import type { WritingMode } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const threadBody1 = String(body?.threadBody1 || "").trim();
    const threadBody2 = String(body?.threadBody2 || "").trim();
    const scheduledAt = String(body?.scheduledAt || "").trim();

    if (!threadBody1 || !scheduledAt) {
      return NextResponse.json(
        {
          ok: false,
          error: "본문(threadBody1)과 예약 시각(scheduledAt)은 필수입니다.",
        },
        { status: 400 }
      );
    }

    const post = scheduleChainedThread({
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
      scheduledAt,
    });

    return NextResponse.json({
      ok: true,
      post,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "예약 발행 등록에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
