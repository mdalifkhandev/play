/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        'inter-thin': ["Inter_100Thin"],
        'inter-regular': ["Inter_400Regular"],
        'inter-semibold': ["Inter_600SemiBold"],
        'inter-bold': ["Inter_700Bold"],
      },
    },
  },
  plugins: [],
};