import { describe, expect, it } from "vitest";
import { health } from "../src/health";

describe("health", () => {
  it("reports a healthy baseline", () => {
    expect(health()).toBe("ok");
  });
});
