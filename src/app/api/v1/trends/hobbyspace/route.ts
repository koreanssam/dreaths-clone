import { NextRequest, NextResponse } from "next/server";
import { fetchHobbySpaceTrends } from "@/services/trends";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const force = searchParams.get("refresh") === "1";
    const data = await fetchHobbySpaceTrends(force);

    return NextResponse.json({
      ok: true,
      ...data,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Failed to fetch HobbySpace trends",
      },
      { status: 500 }
    );
  }
}
