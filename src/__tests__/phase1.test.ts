import { describe, expect, it } from "vitest";
import { CoupangAffiliateClient } from "@/services/coupang";
import {
  parseGoogleTrendsRssXml,
  parseHobbySpaceRssXml,
} from "@/services/trends";

describe("Phase 1: Coupang HMAC-SHA256 & Trend RSS Parsers", () => {
  it("formats UTC signed-date in yyMMdd'T'HHmmss'Z' format", () => {
    const fixedDate = new Date("2026-10-20T08:15:00Z");
    const formatted = CoupangAffiliateClient.formatSignedDate(fixedDate);
    expect(formatted).toBe("261020T081500Z");
  });

  it("generates exact CEA HMAC-SHA256 authorization header per spec", () => {
    const fixedDate = new Date("2026-10-20T08:15:00Z");
    const result = CoupangAffiliateClient.generateAuthorizationHeader({
      method: "POST",
      urlPath:
        "/v2/providers/affiliate_open_api/apis/openapi/products/search",
      queryString: "keyword=닭가슴살&limit=10",
      accessKey: "TEST_ACCESS_KEY",
      secretKey: "TEST_SECRET_KEY",
      date: fixedDate,
    });

    expect(result.signedDate).toBe("261020T081500Z");
    expect(result.message).toBe(
      "261020T081500ZPOST/v2/providers/affiliate_open_api/apis/openapi/products/searchkeyword=닭가슴살&limit=10"
    );
    expect(result.signature).toMatch(/^[a-f0-9]{64}$/);
    expect(result.authorization).toBe(
      `CEA algorithm=HmacSHA256, access-key=TEST_ACCESS_KEY, signed-date=261020T081500Z, signature=${result.signature}`
    );
  });

  it("parses Google Trends RSS XML items with traffic and news items", () => {
    const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0" xmlns:ht="https://trends.google.co.kr/trending/rss">
        <channel>
          <item>
            <title>애플사이다비니거</title>
            <ht:approx_traffic>20,000+</ht:approx_traffic>
            <pubDate>Tue, 20 Oct 2026 08:00:00 +0900</pubDate>
            <ht:news_item>
              <ht:news_item_title>식전 애사비 열풍</ht:news_item_title>
              <ht:news_item_url>https://example.com/news1</ht:news_item_url>
              <ht:news_item_source>헬스뉴스</ht:news_item_source>
            </ht:news_item>
          </item>
        </channel>
      </rss>`;

    const items = parseGoogleTrendsRssXml(sampleXml);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("애플사이다비니거");
    expect(items[0].approxTraffic).toBe("20,000+");
    expect(items[0].newsItems[0].title).toBe("식전 애사비 열풍");
    expect(items[0].newsItems[0].source).toBe("헬스뉴스");
  });

  it("parses HobbySpace RSS XML and classifies AI briefing vs hotdeal", () => {
    const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
          <item>
            <title>[AI 브리핑] 주요 이슈 키워드 20선</title>
            <link>https://bbs.hobbyspace.org/post/1</link>
            <description>&lt;p&gt;오늘의 핫 키워드 요약입니다.&lt;/p&gt;</description>
          </item>
          <item>
            <title>[쇼핑/핫딜 추천] 실시간 쇼핑몰 핫딜 총정리</title>
            <link>https://bbs.hobbyspace.org/post/2</link>
            <description>역대급 특가 모음</description>
          </item>
        </channel>
      </rss>`;

    const items = parseHobbySpaceRssXml(sampleXml);
    expect(items).toHaveLength(2);
    expect(items[0].section).toBe("ai_briefing");
    expect(items[0].summary).toBe("오늘의 핫 키워드 요약입니다.");
    expect(items[1].section).toBe("hotdeal");
  });
});
