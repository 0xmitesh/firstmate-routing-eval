export type GoogleResource = {
  projectId: string;
  service: "storage" | "firestore";
  resource: string;
};

export function parseGoogleResource(input: string): GoogleResource {
  const match = input.match(
    /^gcp:\/\/([^/]+)\/(storage|firestore)\/(.+)$/,
  );

  if (!match) {
    throw new Error("Invalid Google resource");
  }

  const [, projectId, service, resource] = match;

  return {
    projectId,
    service: service as GoogleResource["service"],
    resource,
  };
}
