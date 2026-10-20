import { NextRequest, NextResponse } from "next/server";
import { CoupangAffiliateClient } from "@/services/coupang";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const coupangUrls: string[] = Array.isArray(body?.coupangUrls)
      ? body.coupangUrls.map(String)
      : body?.productUrl
      ? [String(body.productUrl)]
      : [];

    if (coupangUrls.length === 0) {
      return NextResponse.json(
        { ok: false, error: "변환할 쿠팡 URL(coupangUrls)이 필요합니다." },
        { status: 400 }
      );
    }

    const client = new CoupangAffiliateClient();
    const result = await client.createDeeplinks(coupangUrls);

    return NextResponse.json({
      ok: true,
      shortenUrl: result.deeplinks[0]?.shortenUrl || "",
      ...result,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Coupang deeplink generation failed",
      },
      { status: 500 }
    );
  }
}
