import { describe, expect, it } from "vitest";
import { parseNaverRankResponse } from "@/services/trends";

describe("Naver DataLab keyword rank response handling", () => {
  it("returns keywords from a normal ranks response", () => {
    const body = JSON.stringify({
      statusCode: 200,
      ranks: [
        { rank: 1, keyword: "오메가3" },
        { rank: 2, keyword: "과메기" },
      ],
    });
    expect(parseNaverRankResponse(200, body)).toEqual({
      keywords: ["오메가3", "과메기"],
    });
  });

  it("reports endpoint_changed on 404 / redirect", () => {
    for (const status of [404, 302]) {
      const result = parseNaverRankResponse(status, "");
      expect("error" in result && result.error.kind).toBe("endpoint_changed");
    }
  });

  it("reports endpoint_changed when the response shape changes", () => {
    for (const body of ["<html>점검중</html>", JSON.stringify({ data: [] }), JSON.stringify({ ranks: [] })]) {
      const result = parseNaverRankResponse(200, body);
      expect("error" in result && result.error.kind).toBe("endpoint_changed");
    }
  });

  it("reports blocked on an empty 200 body", () => {
    const result = parseNaverRankResponse(200, "");
    expect("error" in result && result.error.kind).toBe("blocked");
  });
});
