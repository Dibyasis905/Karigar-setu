const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');

async function request(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('karigarsetu_token');
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'API request failed');
  return data;
}

export const api = {
  baseUrl: API_BASE_URL,
  health: () => request('/health'),
  register: async (payload: { name: string; email: string; password: string; role: 'buyer' | 'artisan' }) => {
    const data = await request('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
    localStorage.setItem('karigarsetu_token', data.token);
    localStorage.setItem('karigarsetu_user', JSON.stringify(data.user));
    return data;
  },
  login: async (payload: { email: string; password: string }) => {
    const data = await request('/auth/login', { method: 'POST', body: JSON.stringify(payload) });
    localStorage.setItem('karigarsetu_token', data.token);
    localStorage.setItem('karigarsetu_user', JSON.stringify(data.user));
    return data;
  },
  logout: () => {
    localStorage.removeItem('karigarsetu_token');
    localStorage.removeItem('karigarsetu_user');
  },
  getMe: () => request('/users/me'),
  getArtisanMe: () => request('/artisans/me'),
  getArtisans: (params = '') => request(`/artisans${params ? `?${params}` : ''}`),
  createArtisan: (payload: Record<string, unknown>) => request('/artisans', { method: 'POST', body: JSON.stringify(payload) }),
  updateArtisan: (id: string, payload: Record<string, unknown>) => request(`/artisans/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  getProducts: (params = '') => request(`/products${params ? `?${params}` : ''}`),
  getProduct: (id: string) => request(`/products/${id}`),
  createProduct: (payload: Record<string, unknown>) => request('/products', { method: 'POST', body: JSON.stringify(payload) }),
  updateProduct: (id: string, payload: Record<string, unknown>) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteProduct: (id: string) => request(`/products/${id}`, { method: 'DELETE' }),
  createOrder: (payload: Record<string, unknown>) => request('/orders', { method: 'POST', body: JSON.stringify(payload) }),
  getMyOrders: () => request('/orders/my'),
  getOrder: (id: string) => request(`/orders/${id}`),
  getMyArtisanOrders: () => request('/orders/artisan/my'),
  updateOrderStatus: (id: string, status: string) => request(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

export type ApiProduct = {
  _id: string;
  name: string;
  description?: string;
  category: string;
  material?: string;
  craftType?: string;
  price: number;
  stock: number;
  images?: string[];
  tags?: string[];
  aiGenerated?: boolean;
  isActive?: boolean;
  artisan?: {
    _id: string;
    name?: string;
    craft?: string;
    state?: string;
    district?: string;
    bio?: string;
    imageUrl?: string;
    user?: { name?: string };
  };
};

export type ApiOrder = {
  _id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  shippingAddress: { line1: string; city: string; state: string; pincode: string };
  buyer?: { name?: string; email?: string };
  items: { product?: { _id?: string; name?: string; images?: string[] }; name: string; quantity: number; unitPrice: number }[];
};
