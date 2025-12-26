/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--bg-primary)",
                card: "var(--bg-secondary)",
                "card-hover": "var(--bg-tertiary)",
                elevated: "var(--bg-elevated)",
                primary: {
                    DEFAULT: "var(--accent-primary)",
                    hover: "var(--accent-primary-hover)",
                },
                secondary: "var(--accent-secondary)",
                success: "var(--accent-success)",
                warning: "var(--accent-warning)",
                danger: "var(--accent-danger)",
                ai: "var(--accent-ai)",
                foreground: "var(--text-primary)",
                muted: "var(--text-secondary)",
                tertiary: "var(--text-tertiary)",
            },
            borderRadius: {
                lg: "var(--radius-lg)",
                md: "var(--radius-md)",
                sm: "var(--radius-sm)",
            },
            boxShadow: {
                sm: "var(--shadow-sm)",
                md: "var(--shadow-md)",
                lg: "var(--shadow-lg)",
                xl: "var(--shadow-xl)",
                glow: "var(--shadow-glow)",
            },
        },
    },
    plugins: [],
};
