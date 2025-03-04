<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container>
      <q-page class="flex flex-center bg-grey-2">
        <q-card class="login-card q-pa-lg" style="width: 400px; max-width: 90vw">
          <q-card-section class="text-center">
            <div class="text-h5 q-mb-md">Welcome to Chat</div>
          </q-card-section>

          <q-card-section>
            <q-form @submit.prevent="handleLogin">
              <q-input
                v-model="login"
                filled
                label="Enter your username"
                :rules="[val => !!val || 'Username is required']"
                class="q-mb-md"
                autofocus
                @keyup.enter="handleLogin"
              >
                <template v-slot:prepend>
                  <q-icon name="person" />
                </template>
              </q-input>

              <q-btn
                label="Enter Chat"
                color="primary"
                class="full-width q-py-sm"
                :disable="!login"
                type="submit"
              />
            </q-form>
          </q-card-section>

          <q-card-section v-if="error">
            <q-banner class="bg-negative text-white" rounded>
              <template v-slot:avatar>
                <q-icon name="error" />
              </template>
              {{ error }}
            </q-banner>
          </q-card-section>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
  import { defineComponent } from 'vue';
  import { useRouter } from 'vue-router';
  import { useUserStore } from '../stores/user';
  import { useQuasar } from 'quasar';

  export default defineComponent({
    name: 'LoginView',

    data() {
      return {
        login: '',
        error: '',
        router: useRouter(),
        userStore: useUserStore(),
        $q: useQuasar(),
      };
    },

    methods: {
      async handleLogin() {
        if (!this.login) return;

        try {
          if (this.$q && this.$q.loading) {
            this.$q.loading.show({
              message: 'Logging in...',
              spinnerColor: 'primary',
            });
          }

          await this.userStore.login(this.login);

          if (this.$q && this.$q.loading) {
            this.$q.loading.hide();
          }

          if (this.$q && this.$q.notify) {
            this.$q.notify({
              type: 'positive',
              message: 'Login successful!',
              icon: 'check_circle',
            });
          }

          await this.router.push('/chat');
        } catch (e) {
          if (this.$q && this.$q.loading) {
            this.$q.loading.hide();
          }
          this.error = 'Failed to login. Please try again.';
        }
      },
    },
  });
</script>
