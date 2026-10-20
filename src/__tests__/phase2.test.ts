import { describe, expect, it } from "vitest";
import { createPersona, deletePersona, listPersonas } from "@/db";
import {
  enforceWeaveGuardrails,
  FTC_AFFILIATE_DISCLAIMER,
  weaveThreadsContent,
} from "@/services/gemini";

describe("Phase 2: Persona CRUD & 2-Stage Weave Engine Guardrails", () => {
  it("seeds the 4 default DREATHS personas in SQLite", () => {
    const personas = listPersonas();
    expect(personas.length).toBeGreaterThanOrEqual(4);
    const names = personas.map((p) => p.name);
    expect(names).toContain("현실 부부 일상/유머 (Hey Mongle 스타일)");
    expect(names).toContain("치트키 팩폭 코치 (팔뚝살/스트레칭 스타일)");
    expect(names).toContain("초간단 맛도리 다이어터 (성시경/홍진경 레시피 스타일)");
    expect(names).toContain("정보 큐레이터/뉴스 배달부");
  });

  it("supports custom persona creation and deletion while protecting defaults", () => {
    const created = createPersona({
      name: "테스트 커스텀 페르소나",
      tone: "유쾌한 리뷰어",
      promptInstruction: "짧고 강렬한 3줄 리뷰",
      fewShotExamples: ["이건 진짜 물건입니다."],
      forbiddenWords: ["절대금지단어"],
    });
    expect(created.isDefault).toBe(false);

    // Cannot delete default persona
    expect(deletePersona("persona-heymongle")).toBe(false);
    // Can delete custom persona
    expect(deletePersona(created.id)).toBe(true);
  });

  it("strips external links from Thread 1 and forces FTC disclaimer in Thread 2 for affiliate mode", () => {
    const persona = listPersonas()[0];
    const guarded = enforceWeaveGuardrails({
      threadBody1:
        "안녕하세요! 이거 진짜 좋아요 https://link.coupang.com/a/leakedLink 자세한 건 댓글!",
      threadBody2: "여기서 사세요!",
      mode: "affiliate",
      persona,
      shortenUrl: "https://link.coupang.com/a/bValid99",
    });

    // Thread 1 must NOT have external URLs or forbidden words ("안녕하세요")
    expect(guarded.threadBody1).not.toContain("https://");
    expect(guarded.threadBody1).not.toContain("안녕하세요");
    expect(guarded.threadBody1.length).toBeLessThanOrEqual(500);

    // Thread 2 MUST have the shortenUrl and the FTC disclaimer
    expect(guarded.threadBody2).toContain("https://link.coupang.com/a/bValid99");
    expect(guarded.threadBody2).toContain(FTC_AFFILIATE_DISCLAIMER);
    expect(guarded.complianceVerified).toBe(true);
  });

  it("weaves 2-stage affiliate threads end-to-end", async () => {
    const res = await weaveThreadsContent({
      mode: "affiliate",
      personaId: "persona-tastydieter",
      keyword: "수비드 닭가슴살",
      product: {
        productName: "[쿠팡 베스트] 수비드 닭가슴살 대용량 팩",
        productPrice: 18900,
        shortenUrl: "https://link.coupang.com/a/bChkn77",
      },
    });

    expect(res.complianceVerified).toBe(true);
    expect(res.threadBody1).toContain("수비드 닭가슴살");
    expect(res.threadBody1).not.toContain("https://");
    expect(res.threadBody2).toContain("https://link.coupang.com/a/bChkn77");
    expect(res.threadBody2).toContain(FTC_AFFILIATE_DISCLAIMER);
  });
});
