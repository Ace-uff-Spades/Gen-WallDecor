import { auth } from './firebase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getAuthHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in to continue');
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

async function apiRequest(path: string, options: RequestInit = {}) {
  const authHeader = await getAuthHeader();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  generateDescriptions: (preferences: any, feedback?: string, previousDescriptions?: any[]) =>
    apiRequest('/api/generate/descriptions', {
      method: 'POST',
      body: JSON.stringify({ preferences, feedback, previousDescriptions }),
    }),

  generateImages: (preferences: any, descriptions: any[]) =>
    apiRequest('/api/generate/images', {
      method: 'POST',
      body: JSON.stringify({ preferences, descriptions }),
    }),

  getHistory: () => apiRequest('/api/history'),

  getGeneration: (id: string) => apiRequest(`/api/history/${id}`),

  getProfile: () => apiRequest('/api/user/profile'),

  getUsage: () => apiRequest('/api/admin/usage'),

  getUsageTimeseries: (from: string, to: string) =>
    apiRequest(`/api/admin/usage/timeseries?from=${from}&to=${to}`),

  getPieceDownloadUrl: (generationId: string, pieceIndex: number) =>
    apiRequest(`/api/history/${generationId}/pieces/${pieceIndex}/download-url`),
};
