@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
@import "tailwindcss";

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Outfit", sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;
}

body {
  background-color: #F8FAFC; /* Bento Grid light slate background */
  font-family: var(--font-sans);
  color: #0F172A; /* text-slate-900 */
}

/* Custom styles for Bento Grid look */
.bento-card {
  @apply bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden;
}

.bento-card-interactive {
  @apply bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm hover:border-indigo-600 hover:shadow-md transition-all duration-300 cursor-pointer relative overflow-hidden;
}

.bento-badge {
  @apply px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full;
}

.form-header-bar {
  height: 6px;
  background: #4F46E5; /* Indigo accent */
}

.form-title-text {
  font-family: var(--font-display);
}
