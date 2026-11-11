/**
 * Minimal client of the Cloudbeds API v1.3 (https://developers.cloudbeds.com, spec: github.com/cloudbeds/openapi-specs).
 * Server only: it reads the property's API key from the environment.
 *
 *   CLOUDBEDS_API_KEY      property API key (Cloudbeds: Account > Apps & Marketplace > API Credentials, prefix cbat_)
 *   CLOUDBEDS_PROPERTY_ID  the property's numeric ID
 *   CLOUDBEDS_API_URL      optional, default https://api.cloudbeds.com/api/v1.3
 *
 * GET methods take query parameters; POST methods take application/x-www-form-urlencoded bodies with bracket keys for
 * arrays (rooms[0][roomTypeID]=...). Every answer is JSON with `success`; `success: false` carries `message`.
 * Cloudbeds allows about 5 requests a second per property and may block an IP that keeps bursting after errors, so the
 * provider caches what rarely changes.
 */
const BASE_URL = (process.env.CLOUDBEDS_API_URL || "https://api.cloudbeds.com/api/v1.3").replace(/\/$/, "");
const TIMEOUT_MS = 15_000;

export class CloudbedsError extends Error {
  constructor(
    message: string,
    readonly method: string,
    readonly status?: number,
    /** X-Request-ID of the answer, for Cloudbeds support. */
    readonly requestId?: string | null,
  ) {
    super(`Cloudbeds ${method}: ${message}`);
  }
}

export function propertyId() {
  return process.env.CLOUDBEDS_PROPERTY_ID ?? "";
}

function headers(): HeadersInit {
  return {
    "x-api-key": process.env.CLOUDBEDS_API_KEY ?? "",
    "X-PROPERTY-ID": propertyId(),
    Accept: "application/json",
  };
}

type Params = Record<string, string | number | boolean | undefined | null>;

async function call<T>(method: string, init: RequestInit & { url: string }): Promise<T> {
  let response: Response;
  try {
    response = await fetch(init.url, { ...init, cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (error) {
    throw new CloudbedsError(error instanceof Error ? error.message : "request failed", method);
  }
  const requestId = response.headers.get("x-request-id");
  const data = (await response.json().catch(() => null)) as ({ success?: boolean; message?: string } & T) | null;
  if (!response.ok || !data || data.success === false) {
    throw new CloudbedsError(data?.message ?? `HTTP ${response.status}`, method, response.status, requestId);
  }
  return data;
}

export function cloudbedsGet<T>(method: string, params: Params = {}): Promise<T> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  }
  return call<T>(method, { url: `${BASE_URL}/${method}?${query}`, method: "GET", headers: headers() });
}

export function cloudbedsPost<T>(method: string, body: URLSearchParams): Promise<T> {
  return call<T>(method, {
    url: `${BASE_URL}/${method}`,
    method: "POST",
    headers: { ...headers(), "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
}
