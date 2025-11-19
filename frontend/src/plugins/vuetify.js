// [2] Setup Vuetify
// src/plugins/vuetify.js

import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css'; // Ensure MDI icons are loaded
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light', // or 'dark'
  },
  icons: {
    defaultSet: 'mdi', // Ensure MDI is set as default
  },
});