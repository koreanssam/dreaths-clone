import { NextRequest, NextResponse } from "next/server";
import { CoupangAffiliateClient } from "@/services/coupang";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const keyword = String(body?.keyword || "").trim();
    const limit = Number(body?.limit || 10);

    if (!keyword) {
      return NextResponse.json(
        { ok: false, error: "검색 키워드(keyword)가 필요합니다." },
        { status: 400 }
      );
    }

    const client = new CoupangAffiliateClient();
    const result = await client.searchProducts(keyword, limit);

    return NextResponse.json({
      ok: true,
      keyword,
      ...result,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error ? err.message : "Coupang product search failed",
      },
      { status: 500 }
    );
  }
}
