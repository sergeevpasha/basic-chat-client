<template>
  <q-layout view="hHh LpR fFf" class="chat-app-layout">
    <q-header elevated class="glossy-header">
      <q-toolbar>
        <q-avatar class="q-mr-sm">
          <q-icon name="forum" size="28px" />
        </q-avatar>
        <q-toolbar-title class="text-weight-medium">Basic Chat</q-toolbar-title>
        <q-space />
        <div v-if="userStore.currentUser" class="user-badge q-px-md q-py-xs">
          <q-icon name="person" size="16px" class="q-mr-xs" />
          {{ userStore.currentUser.login }}
        </div>

        <q-btn
          flat
          round
          dense
          icon="logout"
          color="white"
          @click="logout"
          class="q-ml-sm"
          aria-label="Logout"
        >
          <q-tooltip>Logout</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-page-container class="chat-page-container">
      <q-page padding>
        <div class="chat-container q-mx-auto q-mt-md">
          <q-card flat bordered class="full-height chat-card">
            <template v-if="messages.length === 0">
              <div class="column flex-center full-height q-pa-lg empty-state">
                <q-icon name="chat" size="100px" color="primary" class="q-mb-md pulse-animation" />
                <div class="text-h5 text-primary q-mb-sm">No messages yet</div>
                <div class="text-body1 text-grey-7 text-center">
                  Be the first to start the conversation!
                  <q-icon name="arrow_downward" class="q-ml-sm bounce-animation" />
                </div>
              </div>
            </template>

            <template v-else>
              <div class="messages-header q-px-md q-py-sm">
                <q-icon name="chat" class="q-mr-sm" />
                <span class="text-weight-medium">Chat History</span>
              </div>
              <q-separator />
              <q-scroll-area ref="messagesContainer" class="col messages-container">
                <div class="q-pa-md">
                  <div v-for="(message, index) in messages" :key="message.id" class="q-mb-md">
                    <div
                      v-if="index === 0 || shouldShowDateSeparator(message, messages[index - 1])"
                      class="text-center q-py-sm date-separator"
                    >
                      <q-chip outline color="primary" class="date-chip">
                        <q-icon name="event" class="q-mr-xs" />
                        {{ formatDate(message.created_at) }}
                      </q-chip>
                    </div>

                    <q-chat-message
                      :name="message.user.login"
                      :text="[formatMessageContent(message.content)]"
                      :sent="message.user.login === userLogin"
                      :bg-color="getUserBubbleColor(message.user)"
                      text-color="white"
                      :stamp="formatTime(message.created_at)"
                      class="enhanced-chat-message"
                      size="8"
                    >
                      <template v-slot:avatar>
                        <q-avatar
                          :color="getUserBubbleColor(message.user)"
                          text-color="white"
                          size="40px"
                          class="message-avatar"
                        >
                          {{ getInitials(message.user.login) }}
                        </q-avatar>
                      </template>
                    </q-chat-message>
                  </div>
                </div>
              </q-scroll-area>
            </template>

            <q-separator />
            <q-card-section class="message-input-container">
              <q-form @submit.prevent="sendMessage">
                <div class="row items-center">
                  <div class="col">
                    <q-input
                      v-model="newMessage"
                      filled
                      type="textarea"
                      placeholder="Type your message here..."
                      class="message-input"
                      bg-color="grey-1"
                      @keydown.enter.prevent="sendMessage"
                      bottom-slots
                    >
                      <template v-slot:append>
                        <q-btn
                          round
                          color="primary"
                          icon="send"
                          type="submit"
                          :disable="!newMessage.trim()"
                          size="md"
                          @click="sendMessage"
                          class="send-button"
                        >
                          <q-tooltip>Send message</q-tooltip>
                        </q-btn>
                      </template>

                      <template v-slot:hint>
                        <div class="row justify-between items-center text-grey-7 q-px-sm">
                          <span>Press Enter to send</span>
                          <span>{{ newMessage.length }}/1000</span>
                        </div>
                      </template>
                    </q-input>
                  </div>
                </div>
              </q-form>
            </q-card-section>
          </q-card>
        </div>
      </q-page>
    </q-page-container>

    <q-inner-loading :showing="loading" class="custom-loader">
      <div class="column items-center">
        <q-spinner-dots size="60px" color="primary" />
        <div class="q-mt-sm text-subtitle1 text-primary">Loading your messages...</div>
        <div class="text-caption text-grey q-mt-xs">Please wait a moment</div>
      </div>
    </q-inner-loading>
  </q-layout>
</template>

<script lang="ts">
  import { defineComponent } from 'vue';
  import { useRouter } from 'vue-router';
  import { useQuasar } from 'quasar';
  import { date } from 'quasar';
  import { useUserStore } from '../stores/user';
  import { useMessagesStore } from '../stores/messages';

  export default defineComponent({
    name: 'ChatView',

    data() {
      return {
        newMessage: '',
        messagesContainer: null as any,
        loading: true,
        userColors: new Map(),
        colorOptions: [
          'primary',
          'secondary',
          'accent',
          'blue-7',
          'purple-7',
          'indigo-7',
          'teal-7',
          'green-7',
          'pink-7',
          'deep-purple-7',
          'brown-7',
          'blue-grey-7',
        ],
        userStore: useUserStore(),
        messagesStore: useMessagesStore(),
        $q: useQuasar(),
        router: useRouter(),
      };
    },

    computed: {
      messages() {
        return this.messagesStore.messages;
      },
      userLogin() {
        return this.userStore.currentUser?.login || '';
      },
      isLoggedIn() {
        return this.userStore.isLoggedIn;
      },
      websocketError() {
        return this.messagesStore.error;
      },
    },

    watch: {
      'messages.length': function (newLength, oldLength) {
        if (newLength > oldLength) {
          this.$nextTick(() => {
            this.scrollToBottom();
          });
        }
      },
    },

    mounted() {
      if (!this.isLoggedIn) {
        this.router.push({ name: 'login' });
        return;
      }

      this.messagesStore
        .fetchMessages()
        .then(() => {
          this.loading = false;
          this.scrollToBottom();
        })
        .catch(error => {
          this.loading = false;
          this.$q.notify({
            type: 'negative',
            message: 'Failed to load messages',
            icon: 'error',
          });
        });

      this.messagesStore.startMessageEvents();
    },

    unmounted() {
      this.messagesStore.stopMessageEvents();
    },

    methods: {
      sendMessage() {
        if (!this.newMessage.trim()) return;

        try {
          this.messagesStore
            .sendMessage(this.newMessage)
            .then(response => {
              this.newMessage = '';

              this.$nextTick(() => {
                this.scrollToBottom();
              });
            })
            .catch(error => {
              this.$q.notify({
                type: 'negative',
                message: 'Failed to send message. Please try again.',
                icon: 'error',
              });
            });
        } catch (error) {
          this.$q.notify({
            type: 'negative',
            message: 'An error occurred when sending the message',
            icon: 'error',
          });
        }
      },

      scrollToBottom() {
        if (this.messagesContainer) {
          const scrollArea = this.messagesContainer;
          scrollArea.setScrollPosition('vertical', 1000000);
        }
      },

      formatDate(dateString: string): string {
        const messageDate = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (messageDate.toDateString() === today.toDateString()) {
          return 'Today';
        } else if (messageDate.toDateString() === yesterday.toDateString()) {
          return 'Yesterday';
        } else {
          return date.formatDate(messageDate, 'ddd, MMM D, YYYY');
        }
      },

      formatTime(dateString: string): string {
        return date.formatDate(new Date(dateString), 'h:mm A');
      },

      shouldShowDateSeparator(message: any, prevMessage: any): boolean {
        if (!prevMessage) return true;

        const messageDate = new Date(message.created_at);
        const prevMessageDate = new Date(prevMessage.created_at);

        return messageDate.toDateString() !== prevMessageDate.toDateString();
      },

      getInitials(name: string): string {
        return name.substring(0, 2).toUpperCase();
      },

      getUserBubbleColor(user: any): string {
        if (user.login === this.userLogin) {
          return 'primary';
        }

        if (!this.userColors.has(user.id)) {
          const colorIndex = this.userColors.size % this.colorOptions.length;
          this.userColors.set(user.id, this.colorOptions[colorIndex]);
        }

        return this.userColors.get(user.id);
      },

      formatMessageContent(content: any): string {
        if (!content) return '';

        if (typeof content === 'string') {
          if (content.startsWith('{') && content.endsWith('}')) {
            try {
              const parsedContent = JSON.parse(content);
              if (parsedContent.content) {
                return parsedContent.content;
              }
            } catch (e) {}
          }
          return content;
        }

        if (typeof content === 'object' && content !== null) {
          if (content.content) {
            return content.content;
          }
          return JSON.stringify(content);
        }

        return String(content);
      },

      logout() {
        this.messagesStore.stopMessageEvents();
        this.userStore.logout();
        this.router.push({ name: 'login' });
        this.$q.notify({
          type: 'positive',
          message: 'Successfully logged out',
          icon: 'logout',
          position: 'top',
        });
      },
    },
  });
</script>

<style scoped>
  .chat-app-layout {
    background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
  }

  .chat-container {
    max-width: 900px;
    height: calc(100vh - 120px);
  }

  .glossy-header {
    background: linear-gradient(145deg, var(--q-primary) 0%, #2c82c9 100%);
    box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.1);
  }

  .user-badge {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    display: flex;
    align-items: center;
    backdrop-filter: blur(5px);
  }

  .chat-card {
    height: 100%;
    display: flex;
    flex-direction: column;
    border-radius: 16px;
    background-color: white;
    overflow: hidden;
  }

  .messages-container {
    height: calc(100vh - 220px);
    background-color: #f8f9fa;
  }

  .messages-header {
    display: flex;
    align-items: center;
    height: 60px;
    font-size: 1.1rem;
  }

  .full-height {
    height: 100%;
  }

  .message-input-container {
    min-height: 80px;
    padding: 12px 16px;
    background-color: white;
  }

  .message-input {
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  }

  .message-input :deep(.q-field__control) {
    padding: 8px 12px;
  }

  .send-button {
    margin-right: -6px;
    margin-left: 8px;
    box-shadow: 0 3px 10px rgba(var(--q-primary-rgb), 0.3);
    transition: transform 0.2s;
  }

  .send-button:hover {
    transform: scale(1.05);
  }

  .enhanced-chat-message {
    margin-bottom: 16px;
    --avatar-spacing: 30px;
  }

  .enhanced-chat-message :deep(.q-message-container.row.reverse) {
    margin-right: 16px !important;
  }

  .enhanced-chat-message :deep(.q-message-container.row.reverse .q-message-avatar) {
    margin-left: 35px !important;
  }

  .enhanced-chat-message :deep(.q-message-text) {
    border-radius: 16px;
    padding: 12px 16px;
    box-shadow: 0 3px 15px rgba(0, 0, 0, 0.06);
    white-space: pre-wrap;
    word-break: break-word;
    position: relative;
    margin: 0 4px;
  }

  .enhanced-chat-message :deep(.q-message-text-content) {
    max-width: 100%;
  }

  .enhanced-chat-message :deep(.q-message-name) {
    font-weight: 600;
    font-size: 0.9rem;
    margin-bottom: 4px;
    padding-left: 8px;
    color: #333;
  }

  .enhanced-chat-message :deep(.q-message-container) {
    margin-top: 8px;
  }

  .enhanced-chat-message :deep(.q-message-sent) .q-message-name {
    text-align: right;
    padding-right: 8px;
  }

  .enhanced-chat-message :deep(.q-message-text--received) {
    border-bottom-left-radius: 0 !important;
  }

  .enhanced-chat-message :deep(.q-message-text--received)::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: -12px;
    width: 0;
    height: 0;
    border: 12px solid transparent;
    border-right-color: inherit;
    border-left: 0;
    border-bottom: 0;
  }

  .enhanced-chat-message :deep(.q-message-text--sent) {
    border-bottom-right-radius: 0 !important;
  }

  .enhanced-chat-message :deep(.q-message-text--sent)::after {
    content: '';
    position: absolute;
    bottom: 0;
    right: -12px;
    width: 0;
    height: 0;
    border: 12px solid transparent;
    border-left-color: inherit;
    border-right: 0;
    border-bottom: 0;
  }

  .empty-state {
    color: #888;
  }

  .date-separator {
    margin: 20px 0;
  }

  .date-chip {
    background-color: rgba(0, 0, 0, 0.03);
    font-weight: 500;
  }

  .pulse-animation {
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% {
      transform: scale(0.97);
      opacity: 0.7;
    }
    50% {
      transform: scale(1);
      opacity: 1;
    }
    100% {
      transform: scale(0.97);
      opacity: 0.7;
    }
  }

  .bounce-animation {
    animation: bounce 2s infinite;
  }

  @keyframes bounce {
    0%,
    20%,
    50%,
    80%,
    100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-8px);
    }
    60% {
      transform: translateY(-4px);
    }
  }

  .custom-loader {
    background-color: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(3px);
  }
</style>
