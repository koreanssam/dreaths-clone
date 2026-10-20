import Database from "better-sqlite3";
import crypto from "crypto";
import path from "path";
import type {
  AccountCredential,
  BenchmarkItem,
  Persona,
  PostRecord,
  PostStatus,
  WritingMode,
} from "@/types";

const DB_PATH =
  process.env.DATABASE_PATH || path.join(process.cwd(), "dreaths.db");

export const DEFAULT_USER_ID = "00000000-0000-4000-8000-000000000001";

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (dbInstance) return dbInstance;

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  initSchema(db);
  seedDefaults(db);

  dbInstance = db;
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      subscription_tier TEXT NOT NULL DEFAULT 'pro',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      access_token TEXT,
      refresh_token TEXT,
      api_key TEXT,
      secret_key TEXT,
      expires_at TEXT,
      UNIQUE(user_id, provider),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS personas (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      tone TEXT NOT NULL,
      prompt_instruction TEXT NOT NULL,
      few_shot_examples TEXT NOT NULL DEFAULT '[]',
      forbidden_words TEXT NOT NULL DEFAULT '[]',
      is_default INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      persona_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      mode TEXT NOT NULL DEFAULT 'affiliate',
      target_keyword TEXT NOT NULL,
      coupang_product_id TEXT,
      coupang_deeplink TEXT,
      thread_body_1 TEXT NOT NULL,
      thread_body_2 TEXT NOT NULL,
      thread_external_id_1 TEXT,
      thread_external_id_2 TEXT,
      scheduled_at TEXT,
      published_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS trend_cache (
      category TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      raw_data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS benchmarks (
      id TEXT PRIMARY KEY,
      author_handle TEXT NOT NULL,
      category TEXT NOT NULL,
      hook_text TEXT NOT NULL,
      reply_text TEXT NOT NULL,
      likes_count INTEGER NOT NULL DEFAULT 0,
      replies_count INTEGER NOT NULL DEFAULT 0,
      saved_at TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT ''
    );
  `);
}

function seedDefaults(db: Database.Database) {
  const now = new Date().toISOString();

  db.prepare(
    `INSERT OR IGNORE INTO users (id, email, subscription_tier, created_at)
     VALUES (?, ?, ?, ?)`
  ).run(DEFAULT_USER_ID, "creator@dreaths.local", "pro", now);

  const countRow = db
    .prepare(`SELECT COUNT(*) as cnt FROM personas WHERE is_default = 1`)
    .get() as { cnt: number };

  if (countRow.cnt === 0) {
    const defaultPersonas: Omit<Persona, "userId">[] = [
      {
        id: "persona-heymongle",
        name: "현실 부부 일상/유머 (Hey Mongle 스타일)",
        tone: "친근하고 위트 있는 대화체 반말",
        promptInstruction:
          "남편/아내 혹은 찐친에게 수다 떨듯 위트 있고 솔직한 반말 톤을 사용하세요. 첫 줄에 생활 밀착형 에피소드나 웃긴 상황극으로 후킹하고, 직접 써보고 놀란 포인트를 구어체로 풀어나가세요.",
        fewShotExamples: [
          "아니 어제 남편이 갑자기 택배 박스를 숨기길래 뭔가 했더니 ㅋㅋㅋ 결국 나한테 딱 걸림.",
          "솔직히 이건 나만 알고 싶었는데 동네방네 소문내고 싶어서 참을 수가 없다 진짜...",
        ],
        forbiddenWords: ["안녕하세요", "소개해드립니다", "구매하세요", "최고의 제품"],
        isDefault: true,
      },
      {
        id: "persona-factcoach",
        name: "치트키 팩폭 코치 (팔뚝살/스트레칭 스타일)",
        tone: "단호하고 전문적인 큐레이션",
        promptInstruction:
          "독자의 잘못된 습관을 첫 줄에서 뼈 때리게 지적(팩폭)한 뒤, 이를 단숨에 해결하는 치트키 솔루션을 번호 매기기(1, 2, 3)로 명쾌하게 정리하세요. 군더더기 없는 단호한 전문가 어조를 유지하세요.",
        fewShotExamples: [
          "아직도 아침마다 비싼 돈 주고 이거 사 드시나요? 그거 다 설탕물 마시는 겁니다.",
          "딱 3가지만 기억하세요. 이 루틴 하나만 바꿔도 삶의 질이 완전히 달라집니다.",
        ],
        forbiddenWords: ["어쩌면", "아마도", "좋을 것 같아요", "부탁드려요"],
        isDefault: true,
      },
      {
        id: "persona-tastydieter",
        name: "초간단 맛도리 다이어터 (성시경/홍진경 레시피 스타일)",
        tone: "진정성 있는 내돈내산 톤",
        promptInstruction:
          "먹는 것에 진심인 미식가이자 똑똑한 관리자의 시선으로 작성하세요. 조리 과정이나 섭취 감상을 오감이 느껴지게 묘사하고, 가격 대비 용량과 가성비를 꼼꼼히 짚어주세요.",
        fewShotExamples: [
          "다이어트한다고 퍽퍽한 것만 먹으면 무조건 입 터집니다. 이건 진짜 반칙 수준으로 맛있어요.",
          "팬에 기름 살짝 두르고 3분만 구워보세요. 겉바속촉 식감에 야식 생각이 싹 사라집니다.",
        ],
        forbiddenWords: ["광고", "협찬", "무조건 사세요"],
        isDefault: true,
      },
      {
        id: "persona-newscurator",
        name: "정보 큐레이터/뉴스 배달부",
        tone: "객관적이고 깔끔한 요약체",
        promptInstruction:
          "실시간 트렌드와 쇼핑 인사이트 데이터를 기반으로 핵심 팩트만 일목요연하게 브리핑하세요. 이모지와 불릿 포인트를 적절히 활용해 가독성을 높이고 바쁜 현대인이 10초 안에 읽을 수 있게 구성하세요.",
        fewShotExamples: [
          "[실시간 쇼핑 트렌드 급상승] 지금 가장 많이 검색되고 있는 품절 대란 아이템 3줄 요약",
          "왜 갑자기 이 제품이 1위에 올랐을까? 핵심 스펙과 가격 변동 포인트 정리해 드립니다.",
        ],
        forbiddenWords: ["대박", "헐", "ㅋㅋㅋ"],
        isDefault: true,
      },
    ];

    const insertPersona = db.prepare(`
      INSERT INTO personas (
        id, user_id, name, tone, prompt_instruction, few_shot_examples, forbidden_words, is_default
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of defaultPersonas) {
      insertPersona.run(
        p.id,
        DEFAULT_USER_ID,
        p.name,
        p.tone,
        p.promptInstruction,
        JSON.stringify(p.fewShotExamples),
        JSON.stringify(p.forbiddenWords),
        p.isDefault ? 1 : 0
      );
    }
  }

  const benchCount = db
    .prepare(`SELECT COUNT(*) as cnt FROM benchmarks`)
    .get() as { cnt: number };

  if (benchCount.cnt === 0) {
    const insertBench = db.prepare(`
      INSERT INTO benchmarks (
        id, author_handle, category, hook_text, reply_text, likes_count, replies_count, saved_at, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertBench.run(
      "bench-1",
      "@heymongle_daily",
      "생활/건강",
      "아니 남편이 새벽마다 부스럭거리길래 몰래 봤더니 ㅋㅋㅋ 화장실 타일 줄눈에 이걸 바르고 있더라고. 아침에 일어나서 호텔 욕실인 줄 알고 소리 지름. 솔직히 업체 부르면 30만 원인데 만 원대로 끝낸 거 실화냐... 자세한 건 첫 댓글에 남겨둘게!",
      "남편이 몰래 사서 대박 친 줄눈 코팅제 좌표 공유합니다 👇\nhttps://link.coupang.com/a/example01\n\n이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.",
      1840,
      312,
      now,
      "부부 일상 에피소드 후킹 + 비용 비교(30만원 vs 만원대)로 전환율 극대화"
    );

    insertBench.run(
      "bench-2",
      "@diet_cheatkey",
      "식품",
      "아직도 닭가슴살 퍽퍽하게 삶아 드시나요? 그러다 3일 만에 치킨 시킵니다.\n\n성시경도 인정한 겉바속촉 저당 단백질 식단 포인트 3가지:\n1. 수비드 공법으로 육즙 보존\n2. 1팩당 단백질 24g, 당류 1g 미만\n3. 전자레인지 1분 30초 컷\n\n자세한 링크는 첫 댓글에 남겨둘게!",
      "냉동실 쟁여템 수비드 닭가슴살 최저가 링크 👇\nhttps://link.coupang.com/a/example02\n\n이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.",
      965,
      148,
      now,
      "팩폭 질문형 오프닝 + 숫자 3가지 요약 구조"
    );

    insertBench.run(
      "bench-3",
      "@tech_curator_kr",
      "디지털/가전",
      "[실시간 품절 대란] 왜 요즘 카페마다 다 이 맥세이프 보조배터리만 쓸까?\n\n- 두께 8.9mm 초슬림인데 10000mAh 괴물 용량\n- 발열 제어 칩셋 탑재로 아이폰 배터리 수명 보호\n- 거치대 일체형이라 KTX/비행기에서 넷플릭스 보기 딱 좋음\n\n자세한 링크는 첫 댓글에 남겨둘게!",
      "오늘만 쿠팡 와우할인 들어간 맥세이프 슬림팩 바로가기 👇\nhttps://link.coupang.com/a/example03\n\n이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.",
      1290,
      204,
      now,
      "트렌드 큐레이션 톤 + 3줄 스펙 요약"
    );
  }
}

// --- Trend Cache Helpers (TTL default: 1 hour = 3600_000 ms) ---
const CACHE_TTL_MS = 60 * 60 * 1000;

export function getTrendCache<T>(category: string, ttlMs = CACHE_TTL_MS): {
  data: T;
  updatedAt: string;
  isExpired: boolean;
} | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT category, source, raw_data, updated_at FROM trend_cache WHERE category = ?`
    )
    .get(category) as
    | {
        category: string;
        source: string;
        raw_data: string;
        updated_at: string;
      }
    | undefined;

  if (!row) return null;

  const updatedTime = new Date(row.updated_at).getTime();
  const isExpired = Date.now() - updatedTime > ttlMs;

  return {
    data: JSON.parse(row.raw_data) as T,
    updatedAt: row.updated_at,
    isExpired,
  };
}

export function setTrendCache(
  category: string,
  source: "naver" | "google" | "hobbyspace",
  data: unknown
): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO trend_cache (category, source, raw_data, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(category) DO UPDATE SET
       source = excluded.source,
       raw_data = excluded.raw_data,
       updated_at = excluded.updated_at`
  ).run(category, source, JSON.stringify(data), now);
}

// --- Persona Helpers ---
export function listPersonas(): Persona[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, user_id, name, tone, prompt_instruction, few_shot_examples, forbidden_words, is_default
       FROM personas
       ORDER BY is_default DESC, rowid ASC`
    )
    .all() as Array<{
    id: string;
    user_id: string;
    name: string;
    tone: string;
    prompt_instruction: string;
    few_shot_examples: string;
    forbidden_words: string;
    is_default: number;
  }>;

  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    name: r.name,
    tone: r.tone,
    promptInstruction: r.prompt_instruction,
    fewShotExamples: JSON.parse(r.few_shot_examples || "[]"),
    forbiddenWords: JSON.parse(r.forbidden_words || "[]"),
    isDefault: Boolean(r.is_default),
  }));
}

export function getPersonaById(id: string): Persona | null {
  const all = listPersonas();
  return all.find((p) => p.id === id) || all[0] || null;
}

export function createPersona(input: {
  name: string;
  tone: string;
  promptInstruction: string;
  fewShotExamples?: string[];
  forbiddenWords?: string[];
}): Persona {
  const db = getDb();
  const id = `persona-${crypto.randomUUID().slice(0, 8)}`;
  const fewShot = input.fewShotExamples ?? [];
  const forbidden = input.forbiddenWords ?? [];

  db.prepare(
    `INSERT INTO personas (
      id, user_id, name, tone, prompt_instruction, few_shot_examples, forbidden_words, is_default
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 0)`
  ).run(
    id,
    DEFAULT_USER_ID,
    input.name,
    input.tone,
    input.promptInstruction,
    JSON.stringify(fewShot),
    JSON.stringify(forbidden)
  );

  return {
    id,
    userId: DEFAULT_USER_ID,
    name: input.name,
    tone: input.tone,
    promptInstruction: input.promptInstruction,
    fewShotExamples: fewShot,
    forbiddenWords: forbidden,
    isDefault: false,
  };
}

export function deletePersona(id: string): boolean {
  const db = getDb();
  const info = db
    .prepare(`DELETE FROM personas WHERE id = ? AND is_default = 0`)
    .run(id);
  return info.changes > 0;
}

// --- Posts Helpers ---
export function createPostRecord(input: {
  personaId: string;
  status: PostStatus;
  mode: WritingMode;
  targetKeyword: string;
  coupangProductId?: string | null;
  coupangDeeplink?: string | null;
  threadBody1: string;
  threadBody2: string;
  threadExternalId1?: string | null;
  threadExternalId2?: string | null;
  scheduledAt?: string | null;
  publishedAt?: string | null;
}): PostRecord {
  const db = getDb();
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  db.prepare(
    `INSERT INTO posts (
      id, user_id, persona_id, status, mode, target_keyword,
      coupang_product_id, coupang_deeplink,
      thread_body_1, thread_body_2,
      thread_external_id_1, thread_external_id_2,
      scheduled_at, published_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    DEFAULT_USER_ID,
    input.personaId,
    input.status,
    input.mode,
    input.targetKeyword,
    input.coupangProductId ?? null,
    input.coupangDeeplink ?? null,
    input.threadBody1,
    input.threadBody2,
    input.threadExternalId1 ?? null,
    input.threadExternalId2 ?? null,
    input.scheduledAt ?? null,
    input.publishedAt ?? null,
    createdAt
  );

  return {
    id,
    userId: DEFAULT_USER_ID,
    personaId: input.personaId,
    status: input.status,
    mode: input.mode,
    targetKeyword: input.targetKeyword,
    coupangProductId: input.coupangProductId ?? null,
    coupangDeeplink: input.coupangDeeplink ?? null,
    threadBody1: input.threadBody1,
    threadBody2: input.threadBody2,
    threadExternalId1: input.threadExternalId1 ?? null,
    threadExternalId2: input.threadExternalId2 ?? null,
    scheduledAt: input.scheduledAt ?? null,
    publishedAt: input.publishedAt ?? null,
    createdAt,
  };
}

export function listPosts(): PostRecord[] {
  const db = getDb();
  const rows = db
    .prepare(`SELECT * FROM posts ORDER BY created_at DESC LIMIT 100`)
    .all() as Array<Record<string, string | null>>;

  return rows.map((r) => ({
    id: String(r.id),
    userId: String(r.user_id),
    personaId: String(r.persona_id),
    status: (r.status as PostStatus) || "draft",
    mode: (r.mode as WritingMode) || "affiliate",
    targetKeyword: String(r.target_keyword || ""),
    coupangProductId: r.coupang_product_id,
    coupangDeeplink: r.coupang_deeplink,
    threadBody1: String(r.thread_body_1 || ""),
    threadBody2: String(r.thread_body_2 || ""),
    threadExternalId1: r.thread_external_id_1,
    threadExternalId2: r.thread_external_id_2,
    scheduledAt: r.scheduled_at,
    publishedAt: r.published_at,
    createdAt: String(r.created_at),
  }));
}

// --- Accounts / API Credentials Helpers ---
export function getAccountCredential(
  provider: "threads" | "coupang" | "naver" | "gemini"
): AccountCredential | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT * FROM accounts WHERE user_id = ? AND provider = ? LIMIT 1`
    )
    .get(DEFAULT_USER_ID, provider) as Record<string, string | null> | undefined;

  if (!row) return null;
  return {
    id: String(row.id),
    userId: String(row.user_id),
    provider,
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    apiKey: row.api_key,
    secretKey: row.secret_key,
    expiresAt: row.expires_at,
  };
}

export function upsertAccountCredential(input: {
  provider: "threads" | "coupang" | "naver" | "gemini";
  accessToken?: string | null;
  refreshToken?: string | null;
  apiKey?: string | null;
  secretKey?: string | null;
  expiresAt?: string | null;
}): AccountCredential {
  const db = getDb();
  const id = `acct-${input.provider}`;

  db.prepare(
    `INSERT INTO accounts (
      id, user_id, provider, access_token, refresh_token, api_key, secret_key, expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, provider) DO UPDATE SET
      access_token = excluded.access_token,
      refresh_token = excluded.refresh_token,
      api_key = excluded.api_key,
      secret_key = excluded.secret_key,
      expires_at = excluded.expires_at`
  ).run(
    id,
    DEFAULT_USER_ID,
    input.provider,
    input.accessToken ?? null,
    input.refreshToken ?? null,
    input.apiKey ?? null,
    input.secretKey ?? null,
    input.expiresAt ?? null
  );

  return getAccountCredential(input.provider)!;
}

// --- Benchmarks Helpers ---
export function listBenchmarks(): BenchmarkItem[] {
  const db = getDb();
  const rows = db
    .prepare(`SELECT * FROM benchmarks ORDER BY saved_at DESC`)
    .all() as Array<Record<string, string | number>>;

  return rows.map((r) => ({
    id: String(r.id),
    authorHandle: String(r.author_handle),
    category: String(r.category),
    hookText: String(r.hook_text),
    replyText: String(r.reply_text),
    likesCount: Number(r.likes_count || 0),
    repliesCount: Number(r.replies_count || 0),
    savedAt: String(r.saved_at),
    notes: String(r.notes || ""),
  }));
}

export function createBenchmark(input: {
  authorHandle: string;
  category: string;
  hookText: string;
  replyText: string;
  likesCount?: number;
  repliesCount?: number;
  notes?: string;
}): BenchmarkItem {
  const db = getDb();
  const id = `bench-${crypto.randomUUID().slice(0, 8)}`;
  const savedAt = new Date().toISOString();

  db.prepare(
    `INSERT INTO benchmarks (
      id, author_handle, category, hook_text, reply_text, likes_count, replies_count, saved_at, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.authorHandle,
    input.category,
    input.hookText,
    input.replyText,
    input.likesCount ?? 0,
    input.repliesCount ?? 0,
    savedAt,
    input.notes ?? ""
  );

  return {
    id,
    authorHandle: input.authorHandle,
    category: input.category,
    hookText: input.hookText,
    replyText: input.replyText,
    likesCount: input.likesCount ?? 0,
    repliesCount: input.repliesCount ?? 0,
    savedAt,
    notes: input.notes ?? "",
  };
}

export function deleteBenchmark(id: string): boolean {
  const db = getDb();
  const info = db.prepare(`DELETE FROM benchmarks WHERE id = ?`).run(id);
  return info.changes > 0;
}
