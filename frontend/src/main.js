// File: frontend/src/main.js

import { createApp } from 'vue';
import { createPinia } from 'pinia';

// App & Config
import App from './App.vue';
import router from './router';
import vuetify from './plugins/vuetify';

// Styles
import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(vuetify);

app.mount('#app');