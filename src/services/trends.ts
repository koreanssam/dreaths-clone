import { XMLParser } from "fast-xml-parser";
import * as cheerio from "cheerio";
import {
  getTrendCache,
  setTrendCache,
} from "@/db";
import {
  NAVER_CATEGORIES,
  type GoogleTrendItem,
  type GoogleTrendNewsItem,
  type HobbySpaceItem,
  type NaverCategoryCode,
  type NaverKeywordItem,
} from "@/types";

const ONE_HOUR_MS = 60 * 60 * 1000;

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

export const NAVER_DATALAB_RANK_ENDPOINT =
  "https://datalab.naver.com/shoppingInsight/getCategoryKeywordRank.naver";

export type NaverFetchError = {
  // endpoint_changed: URL or response shape changed → collector code needs updating
  // blocked: Naver answered with an empty body (seen after ~7 rapid calls)
  // network: request never got a response
  kind: "endpoint_changed" | "blocked" | "network";
  message: string;
  detail: string;
  endpoint: string;
};

const NAVER_ERROR_MESSAGES: Record<NaverFetchError["kind"], string> = {
  endpoint_changed:
    "네이버 데이터랩 순위 주소(또는 응답 형식)가 바뀌었습니다. 수집 코드(src/services/trends.ts) 수정이 필요합니다.",
  blocked:
    "네이버가 요청을 잠시 막았습니다(짧은 시간에 너무 많이 호출). 몇 분 뒤 새로고침하세요.",
  network: "네이버 데이터랩에 연결하지 못했습니다. 인터넷 연결을 확인하세요.",
};

function naverError(kind: NaverFetchError["kind"], detail: string): NaverFetchError {
  return {
    kind,
    message: NAVER_ERROR_MESSAGES[kind],
    detail,
    endpoint: NAVER_DATALAB_RANK_ENDPOINT,
  };
}

/**
 * Parses the DataLab keyword rank response. Anything other than a non-empty
 * `ranks` array is reported as an error instead of being papered over.
 */
export function parseNaverRankResponse(
  status: number,
  body: string
): { keywords: string[] } | { error: NaverFetchError } {
  if (status !== 200) {
    return { error: naverError("endpoint_changed", `HTTP ${status}`) };
  }
  if (body.trim() === "") {
    return { error: naverError("blocked", "HTTP 200, empty body") };
  }
  let json: { ranks?: Array<{ keyword?: unknown }> };
  try {
    json = JSON.parse(body);
  } catch {
    return {
      error: naverError("endpoint_changed", `non-JSON response: ${body.slice(0, 120)}`),
    };
  }
  const keywords = Array.isArray(json.ranks)
    ? json.ranks.map((r) => String(r?.keyword ?? "").trim()).filter(Boolean)
    : [];
  if (keywords.length === 0) {
    return {
      error: naverError("endpoint_changed", `no ranks in response: ${body.slice(0, 120)}`),
    };
  }
  return { keywords };
}

/**
 * 3.1.(1) Naver DataLab Shopping Insight keyword ranking
 * Endpoint: POST https://datalab.naver.com/shoppingInsight/getCategoryKeywordRank.naver
 * (the DataLab web page's own endpoint — no API key; the official Open API only returns category ratios)
 * Caching policy: 1 hour TTL, successful results only
 */
export async function fetchNaverShoppingTrends(
  categoryCode: NaverCategoryCode = "50000006",
  forceRefresh = false
): Promise<{
  categoryCode: NaverCategoryCode;
  categoryName: string;
  keywords: NaverKeywordItem[];
  cachedAt: string;
  error?: NaverFetchError;
}> {
  const cacheKey = `naver:${categoryCode}`;
  if (!forceRefresh) {
    const cached = getTrendCache<{
      categoryCode: NaverCategoryCode;
      categoryName: string;
      keywords: NaverKeywordItem[];
    }>(cacheKey, ONE_HOUR_MS);
    if (cached && !cached.isExpired && cached.data.keywords?.length > 0) {
      return {
        ...cached.data,
        cachedAt: cached.updatedAt,
      };
    }
  }

  const categoryMeta =
    NAVER_CATEGORIES.find((c) => c.code === categoryCode) ||
    NAVER_CATEGORIES[0];
  const base = {
    categoryCode,
    categoryName: categoryMeta.name,
  };

  const end = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
  const formatDate = (d: Date) => d.toISOString().slice(0, 10);

  let status: number;
  let body: string;
  try {
    const res = await fetch(NAVER_DATALAB_RANK_ENDPOINT, {
      method: "POST",
      headers: {
        Referer: "https://datalab.naver.com/shoppingInsight/sCategory.naver",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body: new URLSearchParams({
        cid: categoryCode,
        timeUnit: "date",
        startDate: formatDate(start),
        endDate: formatDate(end),
        age: "",
        gender: "",
        device: "",
        page: "1",
        count: "20",
      }).toString(),
      redirect: "manual",
      signal: AbortSignal.timeout(7000),
    });
    status = res.status;
    body = await res.text();
  } catch (err) {
    const error = naverError(
      "network",
      err instanceof Error ? err.message : String(err)
    );
    console.error("[naver-datalab]", error.kind, error.detail);
    return { ...base, keywords: [], cachedAt: new Date().toISOString(), error };
  }

  const parsed = parseNaverRankResponse(status, body);
  if ("error" in parsed) {
    console.error("[naver-datalab]", parsed.error.kind, parsed.error.detail);
    return {
      ...base,
      keywords: [],
      cachedAt: new Date().toISOString(),
      error: parsed.error,
    };
  }

  const payload = {
    ...base,
    keywords: parsed.keywords.slice(0, 20).map((kw, index) => ({
      rank: index + 1,
      keyword: kw,
      categoryCode,
      categoryName: categoryMeta.name,
    })),
  };
  setTrendCache(cacheKey, "naver", payload);

  return {
    ...payload,
    cachedAt: new Date().toISOString(),
  };
}

/**
 * 3.1.(2) Google Trends Realtime Rising Keywords (KR)
 * Endpoint: GET https://trends.google.co.kr/trending/rss?geo=KR
 * Parses title, ht:approx_traffic, ht:news_item
 */
export function parseGoogleTrendsRssXml(xmlContent: string): GoogleTrendItem[] {
  const parsed = xmlParser.parse(xmlContent);
  const rawItems = parsed?.rss?.channel?.item;
  if (!rawItems) return [];

  const itemsArray = Array.isArray(rawItems) ? rawItems : [rawItems];

  return itemsArray.slice(0, 20).map((item: Record<string, unknown>, idx) => {
    const rawNews = item["ht:news_item"];
    const newsList = rawNews
      ? Array.isArray(rawNews)
        ? rawNews
        : [rawNews]
      : [];

    const newsItems: GoogleTrendNewsItem[] = newsList
      .slice(0, 3)
      .map((n: Record<string, unknown>) => ({
        title: String(n["ht:news_item_title"] || "").replace(/&quot;/g, '"'),
        url: String(n["ht:news_item_url"] || ""),
        source: String(n["ht:news_item_source"] || ""),
      }))
      .filter((n) => Boolean(n.title));

    return {
      rank: idx + 1,
      title: String(item.title || ""),
      approxTraffic: String(item["ht:approx_traffic"] || "1,000+"),
      pubDate: String(item.pubDate || new Date().toUTCString()),
      picture: item["ht:picture"] ? String(item["ht:picture"]) : undefined,
      newsItems,
    };
  });
}

export async function fetchGoogleTrendsKr(forceRefresh = false): Promise<{
  items: GoogleTrendItem[];
  cachedAt: string;
  sourceMode: "live_rss" | "fallback";
}> {
  const cacheKey = "google:KR";
  if (!forceRefresh) {
    const cached = getTrendCache<{
      items: GoogleTrendItem[];
      sourceMode: "live_rss" | "fallback";
    }>(cacheKey, ONE_HOUR_MS);
    if (cached && !cached.isExpired) {
      return {
        ...cached.data,
        cachedAt: cached.updatedAt,
      };
    }
  }

  try {
    const res = await fetch("https://trends.google.co.kr/trending/rss?geo=KR", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      const xml = await res.text();
      const parsedItems = parseGoogleTrendsRssXml(xml);
      if (parsedItems.length > 0) {
        const payload = {
          items: parsedItems,
          sourceMode: "live_rss" as const,
        };
        setTrendCache(cacheKey, "google", payload);
        return {
          ...payload,
          cachedAt: new Date().toISOString(),
        };
      }
    }
  } catch {
    // Fallback below if network is blocked or offline
  }

  const fallbackItems: GoogleTrendItem[] = [
    {
      rank: 1,
      title: "애플사이다비니거 혈당 스파이크",
      approxTraffic: "20,000+",
      pubDate: new Date().toUTCString(),
      newsItems: [
        {
          title: "식전 애사비 한 잔 열풍... 저당 식단 필수템 등극",
          url: "https://trends.google.co.kr",
          source: "헬스인사이트",
        },
      ],
    },
    {
      rank: 2,
      title: "맥세이프 기내용 보조배터리",
      approxTraffic: "10,000+",
      pubDate: new Date().toUTCString(),
      newsItems: [
        {
          title: "해외여행 기내 반입 규정 강화에 인증 보조배터리 수요 급증",
          url: "https://trends.google.co.kr",
          source: "테크데일리",
        },
      ],
    },
    {
      rank: 3,
      title: "PDRN 연어 앰플 홈케어",
      approxTraffic: "5,000+",
      pubDate: new Date().toUTCString(),
      newsItems: [
        {
          title: "피부과 시술 대신 홈케어 리들샷·PDRN 화장품 인기",
          url: "https://trends.google.co.kr",
          source: "뷰티경제",
        },
      ],
    },
    {
      rank: 4,
      title: "화장실 줄눈 코팅제 셀프시공",
      approxTraffic: "5,000+",
      pubDate: new Date().toUTCString(),
      newsItems: [
        {
          title: "고물가에 셀프 인테리어·청소용품 판매량 240% 폭증",
          url: "https://trends.google.co.kr",
          source: "리빙뉴스",
        },
      ],
    },
    {
      rank: 5,
      title: "수비드 닭가슴살 단백질 식단",
      approxTraffic: "2,000+",
      pubDate: new Date().toUTCString(),
      newsItems: [
        {
          title: "맛과 영양 다 잡은 고단백 간편식 트렌드 분석",
          url: "https://trends.google.co.kr",
          source: "푸드투데이",
        },
      ],
    },
  ];

  const payload = {
    items: fallbackItems,
    sourceMode: "fallback" as const,
  };
  setTrendCache(cacheKey, "google", payload);
  return {
    ...payload,
    cachedAt: new Date().toISOString(),
  };
}

/**
 * 3.1.(3) HobbySpace Community RSS & Popular Posts Scraper
 * 1st stage: GET https://bbs.hobbyspace.org/rss.xml ([AI 브리핑], [쇼핑/핫딜 추천])
 * 2nd stage: /community/popular/post & /community/popular/ranking HTML parsing
 */
export function parseHobbySpaceRssXml(xmlContent: string): HobbySpaceItem[] {
  const parsed = xmlParser.parse(xmlContent);
  const rawItems = parsed?.rss?.channel?.item;
  if (!rawItems) return [];

  const itemsArray = Array.isArray(rawItems) ? rawItems : [rawItems];

  return itemsArray.slice(0, 30).map((item: Record<string, unknown>, idx) => {
    const title = String(item.title || "").trim();
    const description = String(item.description || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const link = String(item.link || "https://bbs.hobbyspace.org");
    const pubDate = String(item.pubDate || new Date().toISOString());

    const isHotdeal =
      title.includes("쇼핑") ||
      title.includes("핫딜") ||
      title.includes("특가") ||
      title.includes("할인");
    const isAiBriefing =
      title.includes("AI") ||
      title.includes("브리핑") ||
      title.includes("이슈") ||
      title.includes("키워드");

    const section: HobbySpaceItem["section"] = isHotdeal
      ? "hotdeal"
      : isAiBriefing
      ? "ai_briefing"
      : "popular_post";

    return {
      id: `hs-rss-${idx + 1}`,
      section,
      title,
      link,
      summary: description.slice(0, 180),
      publishedAt: pubDate,
      score: Math.max(50, 320 - idx * 14),
    };
  });
}

export function parseHobbySpaceHtml(
  htmlContent: string,
  sectionType: "popular_post" | "popular_ranking" = "popular_post"
): HobbySpaceItem[] {
  const $ = cheerio.load(htmlContent);
  const items: HobbySpaceItem[] = [];

  $("a, article, li, tr").each((idx, el) => {
    if (items.length >= 15) return;
    const text = $(el).text().replace(/\s+/g, " ").trim();
    const href = $(el).attr("href") || $(el).find("a").attr("href") || "";
    if (
      text.length >= 12 &&
      text.length <= 120 &&
      (href.includes("/post") ||
        href.includes("/board") ||
        href.includes("/community") ||
        href.startsWith("http"))
    ) {
      const fullLink = href.startsWith("http")
        ? href
        : `https://bbs.hobbyspace.org${href.startsWith("/") ? "" : "/"}${href}`;
      if (!items.some((existing) => existing.title === text)) {
        items.push({
          id: `hs-html-${sectionType}-${idx}`,
          section: sectionType,
          title: text,
          link: fullLink,
          summary: "커뮤니티 실시간 인기 반응 토픽",
          publishedAt: new Date().toISOString(),
          score: Math.max(45, 250 - items.length * 11),
        });
      }
    }
  });

  return items;
}

export async function fetchHobbySpaceTrends(forceRefresh = false): Promise<{
  items: HobbySpaceItem[];
  cachedAt: string;
  sourceMode: "live" | "curated";
}> {
  const cacheKey = "hobbyspace:all";
  if (!forceRefresh) {
    const cached = getTrendCache<{
      items: HobbySpaceItem[];
      sourceMode: "live" | "curated";
    }>(cacheKey, ONE_HOUR_MS);
    if (cached && !cached.isExpired) {
      return {
        ...cached.data,
        cachedAt: cached.updatedAt,
      };
    }
  }

  const collected: HobbySpaceItem[] = [];
  let sourceMode: "live" | "curated" = "curated";

  try {
    const rssRes = await fetch("https://bbs.hobbyspace.org/rss.xml", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(7000),
    });

    if (rssRes.ok) {
      const xml = await rssRes.text();
      const rssItems = parseHobbySpaceRssXml(xml);
      if (rssItems.length > 0) {
        collected.push(...rssItems);
        sourceMode = "live";
      }
    }
  } catch {
    // Ignore and proceed to stage 2 / curated fallback
  }

  try {
    const popRes = await fetch(
      "https://bbs.hobbyspace.org/community/popular/post",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
        signal: AbortSignal.timeout(6000),
      }
    );
    if (popRes.ok) {
      const html = await popRes.text();
      const htmlItems = parseHobbySpaceHtml(html, "popular_post");
      if (htmlItems.length > 0) {
        collected.push(...htmlItems);
        sourceMode = "live";
      }
    }
  } catch {
    // Ignore network error
  }

  if (collected.length === 0) {
    collected.push(
      {
        id: "hs-1",
        section: "ai_briefing",
        title: "[AI 브리핑] 오늘 주요 이슈 키워드 20선 - 혈당 관리·초슬림 충전기·셀프 홈케어 열풍",
        link: "https://bbs.hobbyspace.org/rss.xml",
        summary:
          "커뮤니티 내 건강/다이어트(애사비, 저당 땅콩버터) 및 생활 밀착형 가성비 아이템 언급량이 전주 대비 185% 상승했습니다.",
        publishedAt: new Date().toISOString(),
        score: 482,
        keywords: ["애플사이다비니거", "저당 땅콩버터", "맥세이프 보조배터리", "PDRN 앰플"],
      },
      {
        id: "hs-2",
        section: "hotdeal",
        title: "[쇼핑/핫딜 추천] 실시간 쇼핑몰 핫딜 총정리 - 수비드 닭가슴살 & 대용량 그릭요거트 특가",
        link: "https://bbs.hobbyspace.org/community/popular/post",
        summary:
          "로켓프레시 및 오픈마켓 타임딜 중 1팩당 단가 역대 최저가 경신 상품 모음. 댓글 반응 폭발 중.",
        publishedAt: new Date().toISOString(),
        score: 419,
        keywords: ["수비드 닭가슴살", "그릭요거트", "알룰로스"],
      },
      {
        id: "hs-3",
        section: "hotdeal",
        title: "[쇼핑/핫딜 추천] 자취생·신혼부부 삶의 질 수직상승 욕실 줄눈 코팅제 & 배수구 발포클리너",
        link: "https://bbs.hobbyspace.org/community/popular/post",
        summary:
          "업체 시공비 아끼는 셀프 청소 치트키 아이템. 비포/애프터 인증글 최다 추천 기록.",
        publishedAt: new Date().toISOString(),
        score: 365,
        keywords: ["타일 줄눈 코팅제", "배수구 클리너", "규조토 발매트"],
      },
      {
        id: "hs-4",
        section: "popular_post",
        title: "요즘 스레드(Threads)에서 조회수 10만 터지는 내돈내산 후기 글쓰기 공식 정리",
        link: "https://bbs.hobbyspace.org/community/popular/ranking",
        summary:
          "1번 본문에는 절대 링크 넣지 말고 공감형 에피소드로 시작해 1번 댓글에 쿠팡 파트너스 링크를 다는 2단 타래 전략이 도달률 핵심.",
        publishedAt: new Date().toISOString(),
        score: 310,
        keywords: ["경량패딩 조끼", "구강세정기", "기내용 캐리어"],
      },
      {
        id: "hs-5",
        section: "popular_ranking",
        title: "직장인 데스크테리어 만족도 1위 GaN 65W 멀티충전기 + 맥세이프 거치대 조합",
        link: "https://bbs.hobbyspace.org/community/popular/ranking",
        summary:
          "케이블 지옥 탈출하는 깔끔한 책상 셋업 추천 리스트 상위권 랭크.",
        publishedAt: new Date().toISOString(),
        score: 278,
        keywords: ["GaN 초고속 멀티충전기", "맥세이프 보조배터리 10000"],
      }
    );
  }

  const payload = {
    items: collected,
    sourceMode,
  };
  setTrendCache(cacheKey, "hobbyspace", payload);

  return {
    ...payload,
    cachedAt: new Date().toISOString(),
  };
}
