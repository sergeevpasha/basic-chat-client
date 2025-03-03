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

<script setup lang="ts">
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { useUserStore } from '../stores/user';
  import { useQuasar } from 'quasar';

  const router = useRouter();
  const userStore = useUserStore();
  const $q = useQuasar();

  const login = ref('');
  const error = ref('');

  const handleLogin = async () => {
    if (!login.value) return;

    try {
      if ($q && $q.loading) {
        $q.loading.show({
          message: 'Logging in...',
          spinnerColor: 'primary',
        });
      }

      await userStore.login(login.value);

      if ($q && $q.loading) {
        $q.loading.hide();
      }

      if ($q && $q.notify) {
        $q.notify({
          type: 'positive',
          message: 'Login successful!',
          icon: 'check_circle',
        });
      }

      await router.push('/chat');
    } catch (e) {
      if ($q && $q.loading) {
        $q.loading.hide();
      }
      error.value = 'Failed to login. Please try again.';
    }
  };
</script>
