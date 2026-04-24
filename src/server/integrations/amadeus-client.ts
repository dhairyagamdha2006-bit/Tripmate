type TokenCache = {
  accessToken: string;
  expiresAt: number;
};

let tokenCache: TokenCache | null = null;

export class AmadeusClient {
  private readonly host = process.env.AMADEUS_HOST ?? 'https://test.api.amadeus.com';

  isConfigured() {
    return Boolean(process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET);
  }

  private async getAccessToken() {
    if (!this.isConfigured()) {
      throw new Error('AMADEUS_NOT_CONFIGURED');
    }

    if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
      return tokenCache.accessToken;
    }

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.AMADEUS_CLIENT_ID ?? '',
      client_secret: process.env.AMADEUS_CLIENT_SECRET ?? ''
    });

    const response = await fetch(`${this.host}/v1/security/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`AMADEUS_AUTH_FAILED:${message}`);
    }

    const data = (await response.json()) as { access_token: string; expires_in: number };
    tokenCache = {
      accessToken: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000
    };

    return data.access_token;
  }

  async get<T = any>(path: string, query?: Record<string, string | number | boolean | undefined | null>) {
    const token = await this.getAccessToken();
    const url = new URL(`${this.host}${path}`);

    Object.entries(query ?? {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`AMADEUS_REQUEST_FAILED:${message}`);
    }

    return (await response.json()) as T;
  }

  async post<T = any>(path: string, body: unknown) {
    const token = await this.getAccessToken();
    const response = await fetch(`${this.host}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`AMADEUS_REQUEST_FAILED:${message}`);
    }

    return (await response.json()) as T;
  }
}

export const amadeusClient = new AmadeusClient();
