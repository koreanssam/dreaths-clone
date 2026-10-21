import { NextRequest, NextResponse } from "next/server";
import { weaveThreadsContent } from "@/services/gemini";
import { WEAVE_MODELS, type WeaveModelId, type WeaveRequest, type WritingMode } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const keyword = String(body?.keyword || "").trim();
    if (!keyword) {
      return NextResponse.json(
        { ok: false, error: "타겟 키워드(keyword)를 입력해 주세요." },
        { status: 400 }
      );
    }

    const model = WEAVE_MODELS.find((m) => m.id === body?.model)?.id as
      | WeaveModelId
      | undefined;
    const weaveReq: WeaveRequest = {
      model,
      mode: (body?.mode as WritingMode) || "affiliate",
      personaId: String(body?.personaId || "persona-heymongle"),
      keyword,
      customInstruction: body?.customInstruction
        ? String(body.customInstruction)
        : undefined,
      product: body?.product
        ? {
            productId: body.product.productId
              ? String(body.product.productId)
              : undefined,
            productName: String(body.product.productName || keyword),
            productPrice: Number(body.product.productPrice || 19800),
            productUrl: body.product.productUrl
              ? String(body.product.productUrl)
              : undefined,
            shortenUrl: body.product.shortenUrl
              ? String(body.product.shortenUrl)
              : undefined,
            features: body.product.features
              ? String(body.product.features)
              : undefined,
          }
        : undefined,
    };

    const result = await weaveThreadsContent(weaveReq);

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error ? err.message : "AI 원고 직조에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
