import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { Quasar, Loading, Notify } from 'quasar';
import { useUserStore } from './stores/user';

import '@quasar/extras/material-icons/material-icons.css';
import 'quasar/dist/quasar.css';

import App from './App.vue';
import router from './router';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(Quasar, {
  plugins: { Loading, Notify },
  config: {
    brand: {
      primary: '#1976d2',
      secondary: '#26A69A',
      accent: '#9C27B0',
      dark: '#1d1d1d',
      positive: '#21BA45',
      negative: '#C10015',
      info: '#31CCEC',
      warning: '#F2C037',
    },
  },
});

const userStore = useUserStore(pinia);
userStore.initFromStorage();

app.mount('#app');
