import axios from 'axios'
import { Product, Transaction, User } from '@/types'

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
}

export const transactionsApi = {
  getAll: () => apiClient.get<Transaction[]>('/transactions'),
  create: (data: Partial<Transaction>) => apiClient.post<Transaction>('/transactions', data),
  syncOffline: (transactions: Transaction[]) => apiClient.post('/transactions/sync', { transactions }),
}

export const authApi = {
  login: (credentials: any) => apiClient.post<{ user: User, token: string }>('/auth/login', credentials),
  refresh: () => apiClient.post<{ token: string }>('/auth/refresh'),
}

export default apiClient
