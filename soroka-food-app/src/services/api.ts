// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// API Error class
export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(
    message: string,
    status: number,
    data?: any
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Token management
export const tokenManager = {
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },

  setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  },

  removeToken(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  getCurrentUser(): any | null {
    const userJson = localStorage.getItem('current_user');
    return userJson ? JSON.parse(userJson) : null;
  },

  setCurrentUser(user: any): void {
    localStorage.setItem('current_user', JSON.stringify(user));
  }
};

// Base API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  // Add authorization token if available
  const token = tokenManager.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle non-JSON responses or empty responses
    const contentType = response.headers.get('content-type');
    const hasJson = contentType?.includes('application/json');

    if (!response.ok) {
      const errorData = hasJson ? await response.json() : { message: response.statusText };

      // Auto-logout on 401 Unauthorized (expired/invalid token)
      // Note: 403 Forbidden means valid token but insufficient permissions, should not logout
      if (response.status === 401) {
        tokenManager.removeToken();
        window.location.href = '/admin/login';
      }

      throw new ApiError(
        errorData.message || 'An error occurred',
        response.status,
        errorData
      );
    }

    // Return null for 204 No Content
    if (response.status === 204) {
      return null as T;
    }

    return hasJson ? await response.json() : null as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error',
      0
    );
  }
}

// Public API methods
export const api = {
  // ========== Auth API ==========
  auth: {
    async login(username: string, password: string): Promise<{ token: string; user: any }> {
      const response = await apiRequest<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      // Save token and user
      if (response.token) {
        tokenManager.setToken(response.token);
      }
      if (response.user) {
        tokenManager.setCurrentUser(response.user);
      }

      return response;
    },

    async register(username: string, email: string, password: string): Promise<{ token: string; user: any }> {
      return apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      });
    },

    async getProfile(): Promise<any> {
      return apiRequest('/auth/profile');
    },

    logout(): void {
      tokenManager.removeToken();
    }
  },

  // ========== Recipes API (Public) ==========
  recipes: {
    async getAll(page = 1, limit = 9, sort?: string): Promise<{ data: any[]; pagination: any }> {
      const sortParam = sort ? `&sort=${sort}` : '';
      return apiRequest(`/recipes?page=${page}&limit=${limit}${sortParam}`);
    },

    async getById(id: number): Promise<any> {
      return apiRequest(`/recipes/${id}`);
    },

    async incrementView(id: number): Promise<{ success: boolean; views: number }> {
      return apiRequest(`/recipes/${id}/view`, {
        method: 'POST',
      });
    },

    async getByCategory(slug: string, page = 1, limit = 9): Promise<{ category: any; recipes: any[]; pagination: any }> {
      return apiRequest(`/categories/${slug}/recipes?page=${page}&limit=${limit}`);
    },

    async getByCuisine(type: string, page = 1, limit = 9): Promise<{ cuisine: any; recipes: any[]; pagination: any }> {
      return apiRequest(`/recipes/cuisines/${type}?page=${page}&limit=${limit}`);
    },

    async search(query: string, page = 1, limit = 9): Promise<{ query: string; data: any[]; pagination: any }> {
      return apiRequest(`/recipes/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
    },

    async getStats(): Promise<{ recipesCount: number; commentsCount: number; usersCount: number }> {
      return apiRequest('/recipes/stats');
    }
  },

  // ========== Categories API (Public) ==========
  categories: {
    async getAll(): Promise<any[]> {
      return apiRequest('/categories');
    }
  },

  // ========== Comments API ==========
  comments: {
    async getByRecipeId(recipeId: number): Promise<any[]> {
      return apiRequest(`/comments/recipe/${recipeId}`);
    },

    async create(data: { recipeId: number; author: string; email: string; rating: number; text: string; website?: string }): Promise<any> {
      return apiRequest('/comments', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }
  },

  // ========== Newsletter API ==========
  newsletter: {
    async subscribe(email: string): Promise<{ message: string }> {
      return apiRequest('/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    }
  },

  // ========== Settings API (Public) ==========
  settings: {
    async getPublic(): Promise<any> {
      return apiRequest('/settings');
    }
  },

  // ========== Static Pages API (Public) ==========
  staticPages: {
    async getBySlug(slug: string): Promise<any> {
      return apiRequest(`/static-pages/${slug}`);
    }
  },

  // ========== Admin API ==========
  admin: {
    // Admin Stats
    async getStats(): Promise<any> {
      return apiRequest('/admin/stats');
    },

    // Admin Recipes
    recipes: {
      async getAll(page = 1, limit = 10): Promise<{ data: any[]; pagination: any }> {
        return apiRequest(`/admin/recipes?page=${page}&limit=${limit}`);
      },

      async getById(id: number): Promise<any> {
        return apiRequest(`/admin/recipes/${id}`);
      },

      async create(data: any): Promise<any> {
        return apiRequest('/admin/recipes', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      },

      async update(id: number, data: any): Promise<any> {
        return apiRequest(`/admin/recipes/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      },

      async delete(id: number): Promise<void> {
        return apiRequest(`/admin/recipes/${id}`, {
          method: 'DELETE',
        });
      }
    },

    // Admin Categories
    categories: {
      async create(data: { name: string; slug: string; description?: string }): Promise<any> {
        return apiRequest('/admin/categories', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      },

      async update(id: number, data: { name: string; slug: string; description?: string }): Promise<any> {
        return apiRequest(`/admin/categories/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      },

      async delete(id: number): Promise<void> {
        return apiRequest(`/admin/categories/${id}`, {
          method: 'DELETE',
        });
      }
    },

    // Admin Tags
    tags: {
      async getAll(): Promise<Array<{ name: string; count: number }>> {
        return apiRequest('/admin/tags');
      },

      async rename(oldName: string, newName: string): Promise<any> {
        return apiRequest('/admin/tags/rename', {
          method: 'PUT',
          body: JSON.stringify({ oldName, newName }),
        });
      },

      async delete(name: string): Promise<void> {
        return apiRequest(`/admin/tags/${encodeURIComponent(name)}`, {
          method: 'DELETE',
        });
      }
    },

    // Admin Comments
    comments: {
      async getAll(status?: 'APPROVED' | 'PENDING' | 'SPAM'): Promise<any[]> {
        const query = status ? `?status=${status}` : '';
        return apiRequest(`/admin/comments${query}`);
      },

      async updateStatus(id: number, status: 'APPROVED' | 'PENDING' | 'SPAM'): Promise<any> {
        return apiRequest(`/admin/comments/${id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        });
      },

      async delete(id: number): Promise<void> {
        return apiRequest(`/admin/comments/${id}`, {
          method: 'DELETE',
        });
      },

      async bulkAction(ids: number[], action: 'delete' | 'approve' | 'spam' | 'pending'): Promise<{ count: number }> {
        return apiRequest('/admin/comments/bulk', {
          method: 'POST',
          body: JSON.stringify({ ids, action }),
        });
      }
    },

    // Admin Newsletter
    newsletter: {
      async getAll(): Promise<any[]> {
        return apiRequest('/admin/newsletter');
      },

      async delete(id: number): Promise<void> {
        return apiRequest(`/admin/newsletter/${id}`, {
          method: 'DELETE',
        });
      }
    },

    // Admin Settings
    settings: {
      async get(): Promise<any> {
        return apiRequest('/admin/settings');
      },

      async update(data: any): Promise<any> {
        return apiRequest('/admin/settings', {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      }
    },

    // Admin Static Pages
    staticPages: {
      async getAll(): Promise<any[]> {
        return apiRequest('/admin/static-pages');
      },

      async getById(id: number): Promise<any> {
        return apiRequest(`/admin/static-pages/${id}`);
      },

      async update(id: number, data: { title: string; content: string }): Promise<any> {
        return apiRequest(`/admin/static-pages/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      }
    },

    // Admin Users
    users: {
      async getAll(role?: string): Promise<any[]> {
        const query = role ? `?role=${role}` : '';
        return apiRequest(`/admin/users${query}`);
      },

      async getById(id: number): Promise<any> {
        return apiRequest(`/admin/users/${id}`);
      },

      async create(data: { username: string; email: string; password: string; role: string }): Promise<any> {
        return apiRequest('/admin/users', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      },

      async update(id: number, data: { username?: string; email?: string; role?: string; active?: boolean }): Promise<any> {
        return apiRequest(`/admin/users/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      },

      async delete(id: number): Promise<void> {
        return apiRequest(`/admin/users/${id}`, {
          method: 'DELETE',
        });
      },

      async changePassword(id: number, newPassword: string): Promise<any> {
        return apiRequest(`/admin/users/${id}/password`, {
          method: 'PATCH',
          body: JSON.stringify({ newPassword }),
        });
      },

      async toggleStatus(id: number, active: boolean): Promise<any> {
        return apiRequest(`/admin/users/${id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ active }),
        });
      }
    },

    // Admin Spam Filter (SUPER_ADMIN only)
    spamFilter: {
      async getSettings(): Promise<any> {
        return apiRequest('/admin/spam-filter');
      },

      async updateSettings(data: {
        enableKeywordFilter?: boolean;
        enableUrlFilter?: boolean;
        enableCapsFilter?: boolean;
        enableRepetitiveFilter?: boolean;
        enableDuplicateFilter?: boolean;
        maxUrls?: number;
        capsPercentage?: number;
      }): Promise<any> {
        return apiRequest('/admin/spam-filter', {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      },

      async addKeyword(keyword: string): Promise<any> {
        return apiRequest('/admin/spam-filter/keywords', {
          method: 'POST',
          body: JSON.stringify({ keyword }),
        });
      },

      async removeKeyword(keyword: string): Promise<any> {
        return apiRequest(`/admin/spam-filter/keywords/${encodeURIComponent(keyword)}`, {
          method: 'DELETE',
        });
      }
    }
  },

  // ========== Upload API ==========
  upload: {
    async recipeImage(file: File): Promise<{ url: string }> {
      const formData = new FormData();
      formData.append('image', file);

      const token = tokenManager.getToken();
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/upload/recipe-image`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();

        // Auto-logout on 401/403
        if (response.status === 401 || response.status === 403) {
          tokenManager.removeToken();
          window.location.href = '/admin/login';
        }

        throw new ApiError(error.message || 'Upload failed', response.status);
      }

      return response.json();
    },

    async stepImages(files: File[]): Promise<{ urls: string[] }> {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });

      const token = tokenManager.getToken();
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/upload/step-images`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();

        // Auto-logout on 401/403
        if (response.status === 401 || response.status === 403) {
          tokenManager.removeToken();
          window.location.href = '/admin/login';
        }

        throw new ApiError(error.message || 'Upload failed', response.status);
      }

      return response.json();
    }
  }
};

export default api;
