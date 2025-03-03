import { defineStore } from 'pinia';
import { post } from '../utils/api';

interface User {
  id: number;
  login: string;
  created_at: string;
  updated_at: string;
}

interface UserResponse {
  user: User;
  isNewUser: boolean;
  message: string;
}

export const useUserStore = defineStore('user', {
  state: () => ({
    currentUser: null as User | null,
    isLoggedIn: false,
    error: null as string | null,
  }),

  actions: {
    async login(login: string) {
      try {
        const data = await post<UserResponse>('/api/users', { login });

        this.currentUser = data.user;
        this.isLoggedIn = true;
        this.error = null;

        localStorage.setItem('user', JSON.stringify(data.user));

        if (!localStorage.getItem('auth_token')) {
          const mockToken = `user_${data.user.id}_${Date.now()}`;
          localStorage.setItem('auth_token', mockToken);
        }

        return data;
      } catch (error) {
        this.error = 'Failed to login. Please try again.';
        throw error;
      }
    },

    logout() {
      this.currentUser = null;
      this.isLoggedIn = false;

      localStorage.removeItem('user');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('csrf_token');
    },

    initFromStorage() {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          this.currentUser = JSON.parse(storedUser);
          this.isLoggedIn = true;
        } catch (error) {
          this.logout();
        }
      }
    },
  },

  getters: {
    userLogin: state => state.currentUser?.login,
  },
});
