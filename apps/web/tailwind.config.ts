import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF4D00',
        background: '#0F0F0F',
        surface: '#1A1A1A',
        'surface-elevated': '#242424',
        text: {
          primary: '#FFFFFF',
          secondary: '#A0A0A0',
          muted: '#666666',
        },
        success: '#00C853',
        warning: '#FF9800',
        error: '#FF5252',
      },
    },
  },
  plugins: [],
};
export default config;
