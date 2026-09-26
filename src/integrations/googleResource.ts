export type GoogleResource = {
  projectId: string;
  service: "storage" | "firestore";
  resource: string;
};

export function parseGoogleResource(input: string): GoogleResource {
  if (typeof input !== "string") {
    throw new Error("Invalid Google resource");
  }

  const trimmed = input.trim();
  const match = trimmed.match(
    /^gcp:\/\/([^/\s]+)\/(storage|firestore)\/([^/\s].*)$/,
  );

  if (!match) {
    throw new Error("Invalid Google resource");
  }

  const [, projectId, service, resource] = match;

  if (!projectId || !projectId.trim()) {
    throw new Error("Invalid Google resource");
  }

  if (!resource || !resource.trim()) {
    throw new Error("Invalid Google resource");
  }

  return {
    projectId,
    service: service as GoogleResource["service"],
    resource,
  };
}

export function formatGoogleResource(resource: GoogleResource): string {
  if (
    !resource ||
    typeof resource !== "object" ||
    typeof resource.projectId !== "string" ||
    !resource.projectId.trim() ||
    resource.projectId.includes("/") ||
    /\s/.test(resource.projectId)
  ) {
    throw new Error("Invalid Google resource");
  }

  if (resource.service !== "storage" && resource.service !== "firestore") {
    throw new Error("Invalid Google resource");
  }

  if (
    typeof resource.resource !== "string" ||
    !resource.resource.trim() ||
    resource.resource.startsWith("/") ||
    /^\s/.test(resource.resource)
  ) {
    throw new Error("Invalid Google resource");
  }

  return `gcp://${resource.projectId}/${resource.service}/${resource.resource}`;
}

