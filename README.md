# 🎬 CineScope — Movie & Live OTT Streaming Guide

A modern cinematic web application built with **React 19**, **Vite**, and **OMDb API**, featuring verified live **OTT Streaming availability** (JioHotstar, Netflix, Amazon Prime Video, Apple TV), dynamic debounced search, genre/year filters, and an interactive **Watchlist** tracker with "Plan to Watch" and "Watched" organization.

---

## ✨ Features

- 🔍 **Live Debounced Search**: Fast, responsive search powered by OMDb API with 450ms debounce and trending suggestion chips.
- 📺 **Live OTT Streaming Hub**: Powered by JustWatch without TMDB dependency (100% works in India & US). Tells you exactly where to stream, rent, or buy movies with direct deep-links.
- 🎛️ **Filters & Pagination**: Filter by **Type** (Movies, Series, Episodes), **Release Year**, and browse through paginated result pages.
- 🔖 **Interactive Watchlist**: 
  - Save titles to your personal watchlist (persisted in `localStorage`).
  - Search through saved movies with real-time filtering.
  - Quick action menu to **Remove from Watchlist** or **Move to Watched**.
- 🌟 **Rich Movie Details**: High-res posters, IMDb, Rotten Tomatoes, and Metascore ratings ribbon, full plot, cast, director, box office, awards, and YouTube trailer integration.
- 🎨 **Cinema UI & Performance**: Glassmorphic dark theme, skeleton shimmer loaders, fallback posters, and full SEO/Open Graph/PWA meta tags.
- 🚀 **Production Ready**: Pre-configured with Vercel serverless function (`/api/justwatch.js`) and Netlify edge rewrites (`netlify.toml`).

---

## 🛠️ Tech Stack

- **Frontend**: React 19, React Router v7, Vite
- **Styling**: Vanilla CSS (CSS Grid, Flexbox, Glassmorphism, CSS Custom Properties)
- **APIs**: OMDb API, JustWatch Catalog Proxy
- **Deployment**: Vercel / Netlify / Any Static Host

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Vamshi-Kasturi/CineScope.git
cd CineScope
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file in the root directory:
```env
VITE_OMDB_API_KEY=your_omdb_api_key_here
```

### 4. Run the development server
```bash
npm run dev
```

### 5. Build for production
```bash
npm run build
```

---

## 📄 License
MIT License. Built for movie enthusiasts.
