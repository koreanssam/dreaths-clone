import crypto from "crypto";
import { createPostRecord, getAccountCredential } from "@/db";
import type { PostRecord, WritingMode } from "@/types";

const THREADS_GRAPH_BASE = "https://graph.threads.net/v1.0";

export interface ThreadsPublishStepLog {
  step:
    | "create_container_1"
    | "publish_container_1"
    | "create_reply_container_2"
    | "publish_reply_container_2";
  endpoint: string;
  id: string;
  status: "success" | "simulated";
}

export class ThreadsGraphClient {
  private userId: string;
  private accessToken: string;

  constructor(userId?: string, accessToken?: string) {
    const saved = getAccountCredential("threads");
    this.userId =
      userId || saved?.apiKey || process.env.THREADS_USER_ID || "";
    this.accessToken =
      accessToken ||
      saved?.accessToken ||
      process.env.THREADS_ACCESS_TOKEN ||
      "";
  }

  public hasCredentials(): boolean {
    return Boolean(this.userId && this.accessToken);
  }

  /**
   * 1. Create media container on Meta Threads Graph API v1.0
   * POST https://graph.threads.net/v1.0/{threads-user-id}/threads
   */
  public async createContainer(params: {
    text: string;
    replyToId?: string;
    fetchImpl?: typeof fetch;
  }): Promise<{ id: string; mode: "live" | "simulated"; endpoint: string }> {
    const effectiveUserId = this.userId || "me";
    const endpoint = `${THREADS_GRAPH_BASE}/${effectiveUserId}/threads`;
    const fetcher = params.fetchImpl || fetch;

    if (this.hasCredentials()) {
      const searchParams = new URLSearchParams({
        media_type: "TEXT",
        text: params.text,
        access_token: this.accessToken,
      });
      if (params.replyToId) {
        searchParams.set("reply_to_id", params.replyToId);
      }

      const res = await fetcher(`${endpoint}?${searchParams.toString()}`, {
        method: "POST",
      });

      if (res.ok) {
        const data = (await res.json()) as { id?: string };
        if (data.id) {
          return { id: String(data.id), mode: "live", endpoint };
        }
      }
    }

    return {
      id: `179${crypto.randomInt(100000000000, 999999999999)}`,
      mode: "simulated",
      endpoint,
    };
  }

  /**
   * 2. Publish media container on Meta Threads Graph API v1.0
   * POST https://graph.threads.net/v1.0/{threads-user-id}/threads_publish
   */
  public async publishContainer(params: {
    creationId: string;
    fetchImpl?: typeof fetch;
  }): Promise<{ id: string; mode: "live" | "simulated"; endpoint: string }> {
    const effectiveUserId = this.userId || "me";
    const endpoint = `${THREADS_GRAPH_BASE}/${effectiveUserId}/threads_publish`;
    const fetcher = params.fetchImpl || fetch;

    if (this.hasCredentials()) {
      const searchParams = new URLSearchParams({
        creation_id: params.creationId,
        access_token: this.accessToken,
      });

      const res = await fetcher(`${endpoint}?${searchParams.toString()}`, {
        method: "POST",
      });

      if (res.ok) {
        const data = (await res.json()) as { id?: string };
        if (data.id) {
          return { id: String(data.id), mode: "live", endpoint };
        }
      }
    }

    return {
      id: `180${crypto.randomInt(100000000000, 999999999999)}`,
      mode: "simulated",
      endpoint,
    };
  }

  /**
   * Full 2-Stage Thread Chain Publishing Workflow:
   * Step 1: Create Container 1 (Main Hook Body)
   * Step 2: Publish Container 1 -> published_thread_id_1
   * Step 3: Create Container 2 (Reply with Coupang Shortlink + FTC Disclaimer, reply_to_id = published_thread_id_1)
   * Step 4: Publish Container 2 -> published_thread_id_2
   */
  public async publishChainedThread(input: {
    personaId: string;
    mode: WritingMode;
    targetKeyword: string;
    coupangProductId?: string | null;
    coupangDeeplink?: string | null;
    threadBody1: string;
    threadBody2: string;
    fetchImpl?: typeof fetch;
  }): Promise<{
    post: PostRecord;
    steps: ThreadsPublishStepLog[];
    executionMode: "live" | "simulated";
  }> {
    const steps: ThreadsPublishStepLog[] = [];

    // 1. Create Container 1
    const c1 = await this.createContainer({
      text: input.threadBody1,
      fetchImpl: input.fetchImpl,
    });
    steps.push({
      step: "create_container_1",
      endpoint: c1.endpoint,
      id: c1.id,
      status: c1.mode === "live" ? "success" : "simulated",
    });

    // 2. Publish Container 1
    const p1 = await this.publishContainer({
      creationId: c1.id,
      fetchImpl: input.fetchImpl,
    });
    steps.push({
      step: "publish_container_1",
      endpoint: p1.endpoint,
      id: p1.id,
      status: p1.mode === "live" ? "success" : "simulated",
    });

    let publishedReplyId: string | null = null;

    // 3. Create & Publish Reply Container 2 if threadBody2 is provided
    if (input.threadBody2.trim()) {
      const c2 = await this.createContainer({
        text: input.threadBody2,
        replyToId: p1.id,
        fetchImpl: input.fetchImpl,
      });
      steps.push({
        step: "create_reply_container_2",
        endpoint: c2.endpoint,
        id: c2.id,
        status: c2.mode === "live" ? "success" : "simulated",
      });

      const p2 = await this.publishContainer({
        creationId: c2.id,
        fetchImpl: input.fetchImpl,
      });
      steps.push({
        step: "publish_reply_container_2",
        endpoint: p2.endpoint,
        id: p2.id,
        status: p2.mode === "live" ? "success" : "simulated",
      });

      publishedReplyId = p2.id;
    }

    const post = createPostRecord({
      personaId: input.personaId,
      status: "published",
      mode: input.mode,
      targetKeyword: input.targetKeyword,
      coupangProductId: input.coupangProductId ?? null,
      coupangDeeplink: input.coupangDeeplink ?? null,
      threadBody1: input.threadBody1,
      threadBody2: input.threadBody2,
      threadExternalId1: p1.id,
      threadExternalId2: publishedReplyId,
      publishedAt: new Date().toISOString(),
    });

    return {
      post,
      steps,
      executionMode: p1.mode,
    };
  }
}

export function scheduleChainedThread(input: {
  personaId: string;
  mode: WritingMode;
  targetKeyword: string;
  coupangProductId?: string | null;
  coupangDeeplink?: string | null;
  threadBody1: string;
  threadBody2: string;
  scheduledAt: string;
}): PostRecord {
  return createPostRecord({
    personaId: input.personaId,
    status: "scheduled",
    mode: input.mode,
    targetKeyword: input.targetKeyword,
    coupangProductId: input.coupangProductId ?? null,
    coupangDeeplink: input.coupangDeeplink ?? null,
    threadBody1: input.threadBody1,
    threadBody2: input.threadBody2,
    scheduledAt: input.scheduledAt,
  });
}
