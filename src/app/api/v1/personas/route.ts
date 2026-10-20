import { NextRequest, NextResponse } from "next/server";
import { createPersona, deletePersona, listPersonas } from "@/db";

export async function GET() {
  try {
    const personas = listPersonas();
    return NextResponse.json({
      ok: true,
      personas,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "페르소나 목록을 불러오지 못했습니다.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body?.name || "").trim();
    const tone = String(body?.tone || "").trim();
    const promptInstruction = String(body?.promptInstruction || "").trim();

    if (!name || !tone || !promptInstruction) {
      return NextResponse.json(
        {
          ok: false,
          error: "페르소나 명칭(name), 말투(tone), 지침(promptInstruction)은 필수입니다.",
        },
        { status: 400 }
      );
    }

    const fewShotExamples = Array.isArray(body?.fewShotExamples)
      ? body.fewShotExamples.map(String).filter(Boolean)
      : [];
    const forbiddenWords = Array.isArray(body?.forbiddenWords)
      ? body.forbiddenWords.map(String).filter(Boolean)
      : [];

    const created = createPersona({
      name,
      tone,
      promptInstruction,
      fewShotExamples,
      forbiddenWords,
    });

    return NextResponse.json({
      ok: true,
      persona: created,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "신규 페르소나 생성에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { ok: false, error: "삭제할 페르소나 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const deleted = deletePersona(id);
    if (!deleted) {
      return NextResponse.json(
        {
          ok: false,
          error: "기본 내장 페르소나는 삭제할 수 없거나 존재하지 않는 ID입니다.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "삭제 실패",
      },
      { status: 500 }
    );
  }
}
