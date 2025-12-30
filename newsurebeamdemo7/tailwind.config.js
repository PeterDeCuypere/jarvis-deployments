/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        hmi: {
          // Backgrounds - dark neutral
          bg: '#1a1a1a',
          surface: '#242424',
          border: '#333333',
          // Text hierarchy
          text: '#e0e0e0',
          muted: '#888888',
          // HP-HMI compliant status colors (muted, non-bright versions)
          // Teal/cyan for normal/active states - softer than bright blue
          normal: '#5eadb4',
          // Muted green for good/running/healthy
          good: '#6db385',
          // Soft amber for warnings (not bright yellow)
          warning: '#d4a84a',
          // Red ONLY for alarms/faults/errors
          alarm: '#ef4444',
          // Muted purple/violet for accents
          accent: '#9b8ac4',
          // Additional neutral tones for HP-HMI
          neutral1: '#4a5568',  // Dark gray - for inactive/disabled
          neutral2: '#718096',  // Medium gray - for secondary elements
          neutral3: '#a0aec0',  // Light gray - for less important info
          // Softer cyan for process/equipment states
          process: '#5cc4d6',
          // Additional accent colors for visual hierarchy
          info: '#6b9ac4',      // Soft steel blue for information
          highlight: '#c4a86b', // Soft gold for highlights
          category1: '#7ba3a8', // Teal-gray for category
          category2: '#8b9dc4', // Periwinkle for category
          category3: '#a89b8b', // Warm gray for category
          category4: '#8ba38b'  // Sage green for category
        }
      }
    }
  },
  plugins: []
};
