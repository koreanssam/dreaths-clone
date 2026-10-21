export const FTC_AFFILIATE_DISCLAIMER =
  "이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.";

export type NaverCategoryCode =
  | "50000000" // 패션의류
  | "50000002" // 화장품/미용
  | "50000003" // 디지털/가전
  | "50000004" // 가구/인테리어
  | "50000005" // 출산/육아
  | "50000006" // 식품
  | "50000007" // 스포츠/레저
  | "50000008" // 생활/건강
  | "50000009" // 여가/생활편의
  | "50005542"; // 도서

export interface NaverCategoryMeta {
  code: NaverCategoryCode;
  name: string;
}

export const NAVER_CATEGORIES: NaverCategoryMeta[] = [
  { code: "50000000", name: "패션의류" },
  { code: "50000002", name: "화장품/미용" },
  { code: "50000003", name: "디지털/가전" },
  { code: "50000004", name: "가구/인테리어" },
  { code: "50000005", name: "출산/육아" },
  { code: "50000006", name: "식품" },
  { code: "50000007", name: "스포츠/레저" },
  { code: "50000008", name: "생활/건강" },
  { code: "50000009", name: "여가/생활편의" },
  { code: "50005542", name: "도서" },
];

export interface NaverKeywordItem {
  rank: number;
  keyword: string;
  categoryCode: NaverCategoryCode;
  categoryName: string;
  // DataLab's keyword rank endpoint returns rank only; these are set only for the curated fallback
  ratio?: number;
  change?: "up" | "down" | "same" | "new";
}

export interface GoogleTrendNewsItem {
  title: string;
  url: string;
  source: string;
}

export interface GoogleTrendItem {
  rank: number;
  title: string;
  approxTraffic: string;
  pubDate: string;
  picture?: string;
  newsItems: GoogleTrendNewsItem[];
}

export interface HobbySpaceItem {
  id: string;
  section: "ai_briefing" | "hotdeal" | "popular_post" | "popular_ranking";
  title: string;
  link: string;
  summary: string;
  publishedAt: string;
  score?: number;
  keywords?: string[];
}

export interface CoupangProduct {
  productId: string;
  productName: string;
  productPrice: number;
  productImage: string;
  productUrl: string;
  categoryName?: string;
  isRocket?: boolean;
  isFreeShipping?: boolean;
}

export interface Persona {
  id: string;
  userId: string;
  name: string;
  tone: string;
  promptInstruction: string;
  fewShotExamples: string[];
  forbiddenWords: string[];
  isDefault: boolean;
}

export type WritingMode = "affiliate" | "general";
export type PostStatus = "draft" | "scheduled" | "published" | "failed";

export type AccountProvider =
  | "threads"
  | "coupang"
  | "naver"
  | "gemini"
  | "upstage"
  | "openai";

export const ACCOUNT_PROVIDERS: AccountProvider[] = [
  "upstage",
  "openai",
  "gemini",
  "coupang",
  "threads",
  "naver",
];

export type WeaveModelId = "solar-pro4" | "gpt-6-luna" | "gemini-2.5-flash";

export const WEAVE_MODELS: {
  id: WeaveModelId;
  label: string;
  provider: "upstage" | "openai" | "gemini";
  description: string;
}[] = [
  {
    id: "solar-pro4",
    label: "Upstage Solar Pro 4",
    provider: "upstage",
    description: "한국어 특화 고성능 LLM",
  },
  {
    id: "gpt-6-luna",
    label: "OpenAI GPT-6-Luna",
    provider: "openai",
    description: "범용 고품질 LLM",
  },
  {
    id: "gemini-2.5-flash",
    label: "Google Gemini 2.5 Flash",
    provider: "gemini",
    description: "빠르고 가성비 좋은 LLM",
  },
];

export interface WeaveRequest {
  model?: WeaveModelId;
  mode: WritingMode;
  personaId: string;
  keyword: string;
  customInstruction?: string;
  product?: {
    productId?: string;
    productName: string;
    productPrice: number;
    productUrl?: string;
    shortenUrl?: string;
    features?: string;
  };
}

export interface WeaveResult {
  threadBody1: string;
  threadBody2: string;
  complianceVerified: boolean;
  charCount1: number;
  charCount2: number;
  modelUsed: string;
}

export interface PostRecord {
  id: string;
  userId: string;
  personaId: string;
  status: PostStatus;
  mode: WritingMode;
  targetKeyword: string;
  coupangProductId: string | null;
  coupangDeeplink: string | null;
  threadBody1: string;
  threadBody2: string;
  threadExternalId1: string | null;
  threadExternalId2: string | null;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
}

export interface AccountCredential {
  id: string;
  userId: string;
  provider: AccountProvider;
  accessToken: string | null;
  refreshToken: string | null;
  apiKey: string | null;
  secretKey: string | null;
  expiresAt: string | null;
}

export interface BenchmarkItem {
  id: string;
  authorHandle: string;
  category: string;
  hookText: string;
  replyText: string;
  likesCount: number;
  repliesCount: number;
  savedAt: string;
  notes: string;
}
