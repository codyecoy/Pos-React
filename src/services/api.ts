import axios from 'axios'
import { Category, Customer, MasterProduct, Product, Store, Supplier, Transaction, User } from '@/types'

const API_URL = import.meta.env.VITE_API_URL || 'https://api.pos-example.com/v1'

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor for JWT
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('pos_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  const tenantId = localStorage.getItem('pos_tenant_id')
  const storeId = localStorage.getItem('pos_store_id')
  if (tenantId) (config.headers as any)['x-tenant-id'] = tenantId
  if (storeId) (config.headers as any)['x-store-id'] = storeId
  return config
})

// Response Interceptor for Error Handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized (logout or refresh token)
    }
    return Promise.reject(error)
  }
)

export const productsApi = {
  getAll: () => apiClient.get<Product[]>('/products'),
  getById: (id: string) => apiClient.get<Product>(`/products/${id}`),
  create: (data: Partial<Product>) => apiClient.post<Product>('/products', data),
  update: (id: string, data: Partial<Product>) => apiClient.put<Product>(`/products/${id}`, data),
  delete: (id: string) => apiClient.delete(`/products/${id}`),
  syncOffline: (products: Product[]) => apiClient.post('/products/sync', { products }),
}

export const categoriesApi = {
  getAll: () => apiClient.get<Category[]>('/categories'),
  syncOffline: (categories: Category[]) => apiClient.post('/categories/sync', { categories }),
}

export const transactionsApi = {
  getAll: () => apiClient.get<Transaction[]>('/transactions'),
  create: (data: Partial<Transaction>) => apiClient.post<Transaction>('/transactions', data),
  syncOffline: (transactions: Transaction[]) => apiClient.post('/transactions/sync', { transactions }),
}

export const customersApi = {
  getAll: () => apiClient.get<Customer[]>('/customers'),
  syncOffline: (customers: Customer[]) => apiClient.post('/customers/sync', { customers }),
}

export const suppliersApi = {
  getAll: () => apiClient.get<Supplier[]>('/suppliers'),
  syncOffline: (suppliers: Supplier[]) => apiClient.post('/suppliers/sync', { suppliers }),
}

export const authApi = {
  login: (credentials: any) => apiClient.post<{ user: User, token: string }>('/auth/login', credentials),
  register: (data: any) => apiClient.post<{ user: User, token: string }>('/auth/register', data),
  refresh: () => apiClient.post<{ token: string }>('/auth/refresh'),
}

export const storesApi = {
  list: () => apiClient.get<Store[]>('/stores'),
  create: (data: Partial<Store>) => apiClient.post<Store>('/stores', data),
}

export const masterApi = {
  productsBySegment: (segment: string) => apiClient.get<MasterProduct[]>(`/master/products?segment=${encodeURIComponent(segment)}`),
}

export default apiClient
