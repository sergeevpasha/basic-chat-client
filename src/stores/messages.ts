import { defineStore } from 'pinia';
import { useUserStore } from './user';
import { initEcho, closeEcho } from '../utils/echo';
import { get, post } from '../utils/api';

interface User {
  id: number;
  login: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
  user: User;
}

interface MessagesResponse {
  messages: Message[];
}

interface MessageResponse {
  message: Message;
  status: string;
}

export const useMessagesStore = defineStore('messages', {
  state: () => ({
    messages: [] as Message[],
    error: null as string | null,
    isLoading: false,
    isSubscribed: false,
  }),

  actions: {
    async fetchMessages() {
      const userStore = useUserStore();
      if (!userStore.isLoggedIn) return;

      this.isLoading = true;
      try {
        const params = { login: userStore.userLogin || '' };
        const data = await get<MessagesResponse>('/api/messages', params);

        this.messages = data.messages;
        this.error = null;
      } catch (error) {
        this.error = 'Failed to fetch messages';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async sendMessage(content: string) {
      const userStore = useUserStore();
      if (!userStore.isLoggedIn) return;

      try {
        const messageContent = content.trim();
        const payload = {
          login: userStore.userLogin,
          content: messageContent,
        };

        const data = await post<MessageResponse>('/api/messages', payload);
        this.error = null;
        return data;
      } catch (error) {
        this.error = 'Failed to send message';
        throw error;
      }
    },

    startMessageEvents() {
      const userStore = useUserStore();
      if (!userStore.isLoggedIn) return;

      if (this.isSubscribed) {
        return;
      }

      try {
        const echo = initEcho();

        echo.channel('public-chat').listen('.new-message', (e: any) => {
          let messageData;

          if (typeof e === 'string') {
            try {
              messageData = JSON.parse(e);
            } catch (err) {
              return;
            }
          } else {
            messageData = e;
          }

          if (messageData && messageData.message) {
            const isDuplicate = this.messages.some(m => m.id === messageData.message.id);
            if (!isDuplicate) {
              if (!messageData.message.user && messageData.message.login) {
                messageData.message.user = {
                  id: messageData.message.user_id || 0,
                  login: messageData.message.login,
                  created_at: messageData.message.created_at,
                  updated_at: messageData.message.updated_at,
                };
              }
              this.messages.push(messageData.message);
            }
          } else if (messageData && messageData.id) {
            const isDuplicate = this.messages.some(m => m.id === messageData.id);
            if (!isDuplicate) {
              if (!messageData.user && messageData.login) {
                messageData.user = {
                  id: messageData.user_id || 0,
                  login: messageData.login,
                  created_at: messageData.created_at,
                  updated_at: messageData.updated_at,
                };
              }
              this.messages.push(messageData);
            }
          }
        });

        this.isSubscribed = true;
        this.error = null;
      } catch (error) {
        this.error = 'Failed to connect to chat server';
      }
    },

    stopMessageEvents() {
      this.isSubscribed = false;
      closeEcho();
    },
  },
});
