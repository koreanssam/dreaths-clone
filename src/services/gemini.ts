import { GoogleGenAI } from "@google/genai";
import { getAccountCredential, getPersonaById } from "@/db";
import type { Persona, WeaveRequest, WeaveResult } from "@/types";

export const FTC_AFFILIATE_DISCLAIMER =
  "이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.";

export function buildSystemPrompt(persona: Persona): string {
  const examplesText =
    persona.fewShotExamples.length > 0
      ? persona.fewShotExamples.map((ex, i) => `예시 ${i + 1}: "${ex}"`).join("\n")
      : "자연스러운 구어체 활용";
  const forbiddenText =
    persona.forbiddenWords.length > 0
      ? persona.forbiddenWords.join(", ")
      : "없음";

  return [
    `당신은 Meta Threads(스레드) 바이럴 마케팅 및 제휴마케팅 전문 카피라이터입니다.`,
    `[적용 페르소나]: ${persona.name}`,
    `[어조 및 말투]: ${persona.tone}`,
    `[상세 지침]: ${persona.promptInstruction}`,
    `[참고 예시 문장 (Few-shot)]:\n${examplesText}`,
    `[절대 사용 금지 단어]: ${forbiddenText}`,
    ``,
    `[핵심 규칙 - Threads 2-Stage 타래 분할 아키텍처]:`,
    `1. Thread 1(본문)은 반드시 공백 포함 500자 이내여야 하며, 도달률 페널티 방지를 위해 외부 URL(http/https)을 절대 포함하지 마세요.`,
    `2. Thread 1(본문) 마지막 줄에는 첫 댓글(타래)을 확인하라는 자연스러운 CTA(예: "자세한 링크는 첫 댓글에 남겨둘게!")를 넣으세요.`,
    `3. Thread 2(첫 댓글 타래)에는 쿠팡 파트너스 숏링크와 공정위 필수 심의 문구를 정확히 포함하세요.`,
    `4. 응답은 반드시 JSON 형식 {"threadBody1": "...", "threadBody2": "..."} 으로만 출력하세요.`,
  ].join("\n");
}

export function enforceWeaveGuardrails(params: {
  threadBody1: string;
  threadBody2: string;
  mode: "affiliate" | "general";
  persona: Persona;
  shortenUrl?: string;
}): {
  threadBody1: string;
  threadBody2: string;
  complianceVerified: boolean;
} {
  // 1. Remove any external URLs from Thread 1 to protect Threads reach algorithm
  let body1 = params.threadBody1
    .replace(/https?:\/\/[^\s]+/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // 2. Remove forbidden words if any slipped through
  for (const word of params.persona.forbiddenWords) {
    if (word.trim()) {
      body1 = body1.split(word.trim()).join("");
    }
  }

  // 3. Enforce 500-char limit on Thread 1
  if (body1.length > 500) {
    body1 = body1.slice(0, 496).trimEnd() + "...";
  }

  let body2 = params.threadBody2.trim();

  if (params.mode === "affiliate") {
    const linkToUse =
      params.shortenUrl || "https://link.coupang.com/a/bDreaths";

    if (!body2.includes(linkToUse) && !/https?:\/\/link\.coupang\.com/i.test(body2)) {
      body2 = `${body2}\n\n👇 최저가 & 상세 스펙 바로가기\n${linkToUse}`.trim();
    }

    if (!body2.includes(FTC_AFFILIATE_DISCLAIMER)) {
      body2 = `${body2}\n\n${FTC_AFFILIATE_DISCLAIMER}`.trim();
    }
  }

  const complianceVerified =
    params.mode === "general" ||
    (body2.includes(FTC_AFFILIATE_DISCLAIMER) &&
      !/https?:\/\//i.test(body1) &&
      body1.length <= 500);

  return {
    threadBody1: body1,
    threadBody2: body2,
    complianceVerified,
  };
}

export async function weaveThreadsContent(
  input: WeaveRequest
): Promise<WeaveResult> {
  const persona =
    getPersonaById(input.personaId) || getPersonaById("persona-heymongle")!;
  const systemPrompt = buildSystemPrompt(persona);

  const savedGemini = getAccountCredential("gemini");
  const apiKey = savedGemini?.apiKey || process.env.GEMINI_API_KEY || "";

  const shortenUrl =
    input.product?.shortenUrl ||
    input.product?.productUrl ||
    "https://link.coupang.com/a/bDreaths";

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const userPrompt = [
        `작성 모드: ${
          input.mode === "affiliate"
            ? "쿠팡파트너스 제휴마케팅 (2단 타래)"
            : "간편/전문성 정보글 (링크 없음)"
        }`,
        `타겟 키워드: ${input.keyword}`,
        input.product
          ? `선택 상품명: ${input.product.productName}\n가격: ${input.product.productPrice.toLocaleString()}원\n특장점: ${
              input.product.features || "로켓배송, 가성비 우수, 실사용자 후기 검증"
            }\n삽입할 딥링크: ${shortenUrl}`
          : "",
        input.customInstruction
          ? `사용자 추가 지침: ${input.customInstruction}`
          : "",
        `위 정보를 바탕으로 JSON {"threadBody1": "...", "threadBody2": "..."} 형태로 작성해 주세요.`,
      ]
        .filter(Boolean)
        .join("\n");

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
        },
      });

      const text = response.text || "";
      const parsed = JSON.parse(text) as {
        threadBody1?: string;
        threadBody2?: string;
      };

      if (parsed.threadBody1 && parsed.threadBody2) {
        const guarded = enforceWeaveGuardrails({
          threadBody1: parsed.threadBody1,
          threadBody2: parsed.threadBody2,
          mode: input.mode,
          persona,
          shortenUrl,
        });

        return {
          ...guarded,
          charCount1: guarded.threadBody1.length,
          charCount2: guarded.threadBody2.length,
          modelUsed: "gemini-2.5-flash",
        };
      }
    } catch {
      // Fallback to template engine below if API key is invalid or quota exceeded
    }
  }

  // Deterministic persona-tailored 2-stage weaver fallback
  const generated = generatePersonaTemplateWeave(input, persona, shortenUrl);
  const guarded = enforceWeaveGuardrails({
    threadBody1: generated.threadBody1,
    threadBody2: generated.threadBody2,
    mode: input.mode,
    persona,
    shortenUrl,
  });

  return {
    ...guarded,
    charCount1: guarded.threadBody1.length,
    charCount2: guarded.threadBody2.length,
    modelUsed: "dreaths-persona-engine-v1",
  };
}

function generatePersonaTemplateWeave(
  input: WeaveRequest,
  persona: Persona,
  shortenUrl: string
): { threadBody1: string; threadBody2: string } {
  const kw = input.keyword.trim() || "인기 아이템";
  const prodName = input.product?.productName || `[베스트] ${kw} 추천템`;
  const priceStr = input.product?.productPrice
    ? `${input.product.productPrice.toLocaleString()}원`
    : "1만원대";
  const customNote = input.customInstruction
    ? `\n(${input.customInstruction})`
    : "";

  let body1 = "";
  let body2 = "";

  if (persona.id === "persona-factcoach") {
    body1 = [
      `아직도 '${kw}' 아무거나 대충 골라서 돈 날리고 계신가요?`,
      ``,
      `실패 없이 고르는 핵심 기준 딱 3가지만 정리해 드립니다.`,
      `1. 불필요한 거품 뺀 ${priceStr} 실속 구성인지 확인할 것`,
      `2. 매일 써도 부담 없는 내구성과 실사용 후기 검증 여부`,
      `3. ${prodName}처럼 핵심 스펙이 검증된 정품인지 체크할 것${customNote}`,
      ``,
      input.mode === "affiliate"
        ? `제가 비교해보고 정착한 자세한 링크는 첫 댓글에 남겨둘게요!`
        : `더 자세한 실전 활용 팁은 첫 댓글 타래에서 이어집니다 👇`,
    ].join("\n");
  } else if (persona.id === "persona-tastydieter") {
    body1 = [
      `솔직히 '${kw}' 유행한다고 해서 반신반의하면서 들여왔거든요? 근데 이건 진짜 반칙 수준이에요.`,
      ``,
      `${prodName} 직접 써보니까 왜 다들 재구매하는지 바로 납득했습니다.`,
      `- 가격도 ${priceStr}이라 부담 없이 쟁여두기 딱 좋음`,
      `- 바쁜 아침이나 퇴근 후에 1분이면 준비 끝`,
      `- 퀄리티가 남달라서 삶의 질이 확 올라감${customNote}`,
      ``,
      input.mode === "affiliate"
        ? `자세한 링크는 첫 댓글에 남겨둘게!`
        : `실패 없는 활용 레시피는 첫 댓글에 적어둘게요!`,
    ].join("\n");
  } else if (persona.id === "persona-newscurator") {
    body1 = [
      `📊 [실시간 트렌드 브리핑] 지금 검색량 급상승 중인 '${kw}' 핵심 3줄 요약`,
      ``,
      `• 화제 상품: ${prodName}`,
      `• 현재 가격대: ${priceStr} (가성비 지수 상위권)`,
      `• 인기 요인: 커뮤니티 및 쇼핑 인사이트 클릭 추이 급증, 실사용자 만족도 최상${customNote}`,
      ``,
      input.mode === "affiliate"
        ? `자세한 링크는 첫 댓글에 남겨둘게!`
        : `세부 데이터 및 체크리스트는 첫 댓글을 확인하세요.`,
    ].join("\n");
  } else {
    // Hey Mongle or custom friendly style
    body1 = [
      `아니 어제 택배 뜯자마자 진짜 소리 질렀잖아 ㅋㅋㅋ 그동안 '${kw}' 유목민으로 돈 날린 거 생각하면 눈물 남...`,
      ``,
      `이번에 정착한 ${prodName} 써보니까 왜 이제야 샀나 싶더라.`,
      `가격도 ${priceStr}인데 퀄리티가 미쳤음. 동네방네 소문내고 싶어서 손이 근질거린다 진짜!${customNote}`,
      ``,
      input.mode === "affiliate"
        ? `자세한 링크는 첫 댓글에 남겨둘게!`
        : `내가 직접 써보고 알아낸 꿀팁은 첫 댓글에 적어둘게!`,
    ].join("\n");
  }

  if (input.mode === "affiliate") {
    body2 = [
      `🔥 본문에서 말한 [${prodName}] 최저가 좌표 공유합니다 👇`,
      `${shortenUrl}`,
      ``,
      `${FTC_AFFILIATE_DISCLAIMER}`,
    ].join("\n");
  } else {
    body2 = [
      `💡 '${kw}' 200% 활용하는 추가 체크리스트!`,
      `1. 첫 사용 전 기본 가이드를 꼭 확인하세요.`,
      `2. 본인의 라이프스타일에 맞춰 주 3~5회 꾸준히 루틴화하면 효과가 배가됩니다.`,
      `도움이 되셨다면 저장해두고 필요할 때 꺼내 보세요!`,
    ].join("\n");
  }

  return { threadBody1: body1, threadBody2: body2 };
}
