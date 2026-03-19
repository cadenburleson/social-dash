export class ApiClientError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function fetchJson<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiClientError(
      body || `HTTP ${res.status}: ${res.statusText}`,
      res.status
    );
  }
  return res.json() as Promise<T>;
}

export function rapidApiHeaders(apiKey: string, host: string): HeadersInit {
  return {
    "x-rapidapi-key": apiKey,
    "x-rapidapi-host": host,
  };
}
