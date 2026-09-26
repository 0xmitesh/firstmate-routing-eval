import { describe, expect, it } from "vitest";
import { parseGoogleResource } from "../../src/integrations/googleResource";

describe("parseGoogleResource", () => {
  it("parses a storage resource", () => {
    expect(
      parseGoogleResource(
        "gcp://demo-project/storage/images/product.jpg",
      ),
    ).toEqual({
      projectId: "demo-project",
      service: "storage",
      resource: "images/product.jpg",
    });
  });

  it("rejects malformed resources", () => {
    expect(() =>
      parseGoogleResource("https://example.com/file"),
    ).toThrow("Invalid Google resource");
  });
});
