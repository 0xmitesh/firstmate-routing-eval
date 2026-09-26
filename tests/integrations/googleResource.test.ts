import { describe, expect, it } from "vitest";
import {
  type GoogleResource,
  formatGoogleResource,
  parseGoogleResource,
} from "../../src/integrations/googleResource";

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

  it("parses a firestore resource", () => {
    expect(
      parseGoogleResource(
        "gcp://demo-project/firestore/users/123/orders/456",
      ),
    ).toEqual({
      projectId: "demo-project",
      service: "firestore",
      resource: "users/123/orders/456",
    });
  });

  it("ignores leading and trailing whitespace around the complete input", () => {
    expect(
      parseGoogleResource(
        "   gcp://demo-project/storage/images/product.jpg   ",
      ),
    ).toEqual({
      projectId: "demo-project",
      service: "storage",
      resource: "images/product.jpg",
    });

    expect(
      parseGoogleResource(
        "\n\tgcp://demo-project/firestore/catalogue/item-1 \r\n",
      ),
    ).toEqual({
      projectId: "demo-project",
      service: "firestore",
      resource: "catalogue/item-1",
    });
  });

  it("rejects empty or whitespace-only project IDs", () => {
    expect(() =>
      parseGoogleResource("gcp:///storage/images/product.jpg"),
    ).toThrow("Invalid Google resource");

    expect(() =>
      parseGoogleResource("gcp:// /storage/images/product.jpg"),
    ).toThrow("Invalid Google resource");

    expect(() =>
      parseGoogleResource("gcp://   /storage/images/product.jpg"),
    ).toThrow("Invalid Google resource");
  });

  it("rejects empty or whitespace-only resource paths", () => {
    expect(() =>
      parseGoogleResource("gcp://demo-project/storage"),
    ).toThrow("Invalid Google resource");

    expect(() =>
      parseGoogleResource("gcp://demo-project/storage/"),
    ).toThrow("Invalid Google resource");

    expect(() =>
      parseGoogleResource("gcp://demo-project/storage/   "),
    ).toThrow("Invalid Google resource");

    expect(() =>
      parseGoogleResource("gcp://demo-project/storage//"),
    ).toThrow("Invalid Google resource");
  });

  it("rejects malformed service names", () => {
    expect(() =>
      parseGoogleResource("gcp://demo-project/bigquery/dataset"),
    ).toThrow("Invalid Google resource");

    expect(() =>
      parseGoogleResource("gcp://demo-project//images/product.jpg"),
    ).toThrow("Invalid Google resource");

    expect(() =>
      parseGoogleResource("gcp://demo-project/Storage/images/product.jpg"),
    ).toThrow("Invalid Google resource");
  });

  it("rejects malformed non-gcp resources", () => {
    expect(() =>
      parseGoogleResource("https://example.com/file"),
    ).toThrow("Invalid Google resource");

    expect(() =>
      parseGoogleResource(""),
    ).toThrow("Invalid Google resource");

    expect(() =>
      parseGoogleResource("   "),
    ).toThrow("Invalid Google resource");
  });
});

describe("formatGoogleResource", () => {
  it("formats a storage resource into canonical gcp URI", () => {
    const resource: GoogleResource = {
      projectId: "demo-project",
      service: "storage",
      resource: "images/product.jpg",
    };
    expect(formatGoogleResource(resource)).toBe(
      "gcp://demo-project/storage/images/product.jpg",
    );
  });

  it("formats a firestore resource into canonical gcp URI", () => {
    const resource: GoogleResource = {
      projectId: "prod-db",
      service: "firestore",
      resource: "users/u-42",
    };
    expect(formatGoogleResource(resource)).toBe(
      "gcp://prod-db/firestore/users/u-42",
    );
  });

  it("rejects invalid resources", () => {
    expect(() =>
      formatGoogleResource({
        projectId: "",
        service: "storage",
        resource: "file.jpg",
      }),
    ).toThrow("Invalid Google resource");

    expect(() =>
      formatGoogleResource({
        projectId: "   ",
        service: "storage",
        resource: "file.jpg",
      }),
    ).toThrow("Invalid Google resource");

    expect(() =>
      formatGoogleResource({
        projectId: "demo-project",
        service: "compute" as any,
        resource: "instances/vm-1",
      }),
    ).toThrow("Invalid Google resource");

    expect(() =>
      formatGoogleResource({
        projectId: "demo-project",
        service: "storage",
        resource: "",
      }),
    ).toThrow("Invalid Google resource");

    expect(() =>
      formatGoogleResource({
        projectId: "demo-project",
        service: "storage",
        resource: "   ",
      }),
    ).toThrow("Invalid Google resource");
  });
});

describe("round-trip integration", () => {
  it("parse-then-format yields canonical form", () => {
    const canonicalStorage =
      "gcp://demo-project/storage/images/product.jpg";
    expect(
      formatGoogleResource(
        parseGoogleResource("   " + canonicalStorage + "   \t\n"),
      ),
    ).toBe(canonicalStorage);

    const canonicalFirestore =
      "gcp://demo-project/firestore/documents/order-1";
    expect(
      formatGoogleResource(
        parseGoogleResource("  " + canonicalFirestore + "  "),
      ),
    ).toBe(canonicalFirestore);
  });

  it("format-then-parse round-trips valid resources", () => {
    const storageResource: GoogleResource = {
      projectId: "my-cloud-project",
      service: "storage",
      resource: "assets/css/main.css",
    };
    expect(
      parseGoogleResource(formatGoogleResource(storageResource)),
    ).toEqual(storageResource);

    const firestoreResource: GoogleResource = {
      projectId: "my-cloud-project",
      service: "firestore",
      resource: "accounts/acc-99/profile",
    };
    expect(
      parseGoogleResource(formatGoogleResource(firestoreResource)),
    ).toEqual(firestoreResource);
  });
});

