interface APIClient {
  get: (endpoint: string, params?: Record<string, any>) => Promise<any>;
  post: (endpoint: string, data?: any) => Promise<any>;
}

export const createAPIClient = (
  baseURL: string,
  apiKey?: string
): APIClient => {
  const buildURL = (endpoint: string, params?: Record<string, any>) => {
    const url = new URL(endpoint, baseURL);
    if (params) {
      Object.keys(params).forEach(key =>
        url.searchParams.append(key, params[key])
      );
    }
    return url.toString();
  };

  const buildHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    return headers;
  };

  return {
    get: async (endpoint: string, params?: Record<string, any>) => {
      const url = buildURL(endpoint, params);
      const response = await fetch(url, {
        method: 'GET',
        headers: buildHeaders(),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    },

    post: async (endpoint: string, data?: any) => {
      const url = buildURL(endpoint);
      const response = await fetch(url, {
        method: 'POST',
        headers: buildHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    },
  };
};
