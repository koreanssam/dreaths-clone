import { describe, expect, it } from "vitest";
import {
  scheduleChainedThread,
  ThreadsGraphClient,
} from "@/services/threads";

describe("Phase 3: Meta Threads Graph API v1.0 Chained Publishing & Scheduling", () => {
  it("executes 4-step container -> publish -> reply_to_id container -> publish workflow against Graph API v1.0", async () => {
    const calledUrls: string[] = [];
    const mockFetch: typeof fetch = async (input) => {
      const url = String(input);
      calledUrls.push(url);
      const idx = calledUrls.length;
      return new Response(JSON.stringify({ id: `graph_id_${idx}` }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    const client = new ThreadsGraphClient("99887766", "TH_TEST_ACCESS_TOKEN");
    const result = await client.publishChainedThread({
      personaId: "persona-heymongle",
      mode: "affiliate",
      targetKeyword: "타일 줄눈 코팅제",
      coupangProductId: "12345678",
      coupangDeeplink: "https://link.coupang.com/a/bTile01",
      threadBody1: "본문 후킹 텍스트입니다. 자세한 링크는 첫 댓글에 남겨둘게!",
      threadBody2:
        "https://link.coupang.com/a/bTile01\n이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.",
      fetchImpl: mockFetch,
    });

    expect(result.executionMode).toBe("live");
    expect(result.steps).toHaveLength(4);
    expect(calledUrls[0]).toContain(
      "https://graph.threads.net/v1.0/99887766/threads?"
    );
    expect(calledUrls[1]).toContain(
      "https://graph.threads.net/v1.0/99887766/threads_publish?creation_id=graph_id_1"
    );
    expect(calledUrls[2]).toContain("reply_to_id=graph_id_2");
    expect(calledUrls[3]).toContain(
      "https://graph.threads.net/v1.0/99887766/threads_publish?creation_id=graph_id_3"
    );
    expect(result.post.threadExternalId1).toBe("graph_id_2");
    expect(result.post.threadExternalId2).toBe("graph_id_4");
    expect(result.post.status).toBe("published");
  });

  it("saves scheduled chained threads with status=scheduled", () => {
    const post = scheduleChainedThread({
      personaId: "persona-factcoach",
      mode: "affiliate",
      targetKeyword: "맥세이프 보조배터리",
      threadBody1: "예약 발행 본문",
      threadBody2: "예약 발행 첫 댓글",
      scheduledAt: "2026-10-21T09:00:00.000Z",
    });

    expect(post.status).toBe("scheduled");
    expect(post.scheduledAt).toBe("2026-10-21T09:00:00.000Z");
  });
});
