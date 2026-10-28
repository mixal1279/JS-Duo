import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jsduo.app',
  appName: 'Codexa',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
