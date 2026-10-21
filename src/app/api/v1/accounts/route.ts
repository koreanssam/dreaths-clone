import { NextRequest, NextResponse } from "next/server";
import { getAccountCredential, upsertAccountCredential } from "@/db";
import { ACCOUNT_PROVIDERS, type AccountProvider } from "@/types";

export async function GET() {
  const providers = ACCOUNT_PROVIDERS;
  const status = Object.fromEntries(
    providers.map((p) => {
      const cred = getAccountCredential(p);
      return [
        p,
        {
          configured: Boolean(
            cred?.apiKey || cred?.accessToken || cred?.secretKey
          ),
          apiKeyPreview: cred?.apiKey
            ? `${cred.apiKey.slice(0, 4)}****`
            : "",
        },
      ];
    })
  );

  return NextResponse.json({
    ok: true,
    status,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const provider = body?.provider as AccountProvider;
    if (!ACCOUNT_PROVIDERS.includes(provider)) {
      return NextResponse.json(
        { ok: false, error: "유효하지 않은 provider입니다." },
        { status: 400 }
      );
    }

    upsertAccountCredential({
      provider,
      apiKey: body?.apiKey ? String(body.apiKey).trim() : null,
      secretKey: body?.secretKey ? String(body.secretKey).trim() : null,
      accessToken: body?.accessToken ? String(body.accessToken).trim() : null,
      refreshToken: body?.refreshToken
        ? String(body.refreshToken).trim()
        : null,
    });

    return NextResponse.json({
      ok: true,
      provider,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Failed to save account",
      },
      { status: 500 }
    );
  }
}
