import { NextRequest, NextResponse } from "next/server";
import {
  fetchGoogleTrendsKr,
  fetchHobbySpaceTrends,
  fetchNaverShoppingTrends,
} from "@/services/trends";
import { NAVER_CATEGORIES, type NaverCategoryCode } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = (searchParams.get("category") ||
      "50000006") as NaverCategoryCode;
    const force = searchParams.get("refresh") === "1";

    const [naver, google, hobbyspace] = await Promise.all([
      fetchNaverShoppingTrends(category, force),
      fetchGoogleTrendsKr(force),
      fetchHobbySpaceTrends(force),
    ]);

    return NextResponse.json({
      ok: true,
      categories: NAVER_CATEGORIES,
      naver,
      google,
      hobbyspace,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Failed to fetch insights",
      },
      { status: 500 }
    );
  }
}
