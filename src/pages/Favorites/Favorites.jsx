import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useFavorites } from "../../context/FavoritesContext";
import MovieCard from "../../components/MovieCard/MovieCard";
import "./Favorites.css";

export default function Favorites() {
  const { favorites, clearFavorites } = useFavorites();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'to_watch' | 'watched'

  const toWatchCount = useMemo(() => {
    return favorites.filter((m) => !m.watched).length;
  }, [favorites]);

  const watchedCount = useMemo(() => {
    return favorites.filter((m) => !!m.watched).length;
  }, [favorites]);

  // Filtered by tab and search query
  const filteredFavorites = useMemo(() => {
    return favorites.filter((movie) => {
      // 1. Tab filter
      if (activeTab === "to_watch" && movie.watched) return false;
      if (activeTab === "watched" && !movie.watched) return false;

      // 2. Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = movie.Title?.toLowerCase().includes(q);
      const matchYear = movie.Year?.toLowerCase().includes(q);
      const matchGenre = movie.Genre?.toLowerCase().includes(q);

      return matchTitle || matchYear || matchGenre;
    });
  }, [favorites, activeTab, searchQuery]);

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear your entire watchlist?")) {
      clearFavorites();
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="favorites-container">
      {/* Top Header */}
      <div className="favorites-header">
        <div>
          <h1 className="favorites-title">
            My <span className="gradient-text">Watchlist</span>
          </h1>
          <p className="favorites-subtitle">
            Manage your saved movies, track what you plan to watch, and mark what you've completed.
          </p>
        </div>

        {favorites.length > 0 && (
          <button
            type="button"
            className="clear-all-btn"
            onClick={handleClearAll}
          >
            Clear All ({favorites.length})
          </button>
        )}
      </div>

      {favorites.length > 0 ? (
        <>
          {/* Controls Bar: Search Bar + Status Tabs */}
          <div className="watchlist-controls-bar">
            {/* Search Bar in Watchlist */}
            <div className="watchlist-search-box">
              <span className="watchlist-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search your saved titles by name or year..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="watchlist-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="watchlist-clear-btn"
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Tabs: All, To Watch, Watched */}
            <div className="watchlist-tabs">
              <button
                type="button"
                className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
                onClick={() => setActiveTab("all")}
              >
                All ({favorites.length})
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === "to_watch" ? "active" : ""}`}
                onClick={() => setActiveTab("to_watch")}
              >
                ⏳ Plan to Watch ({toWatchCount})
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === "watched" ? "active" : ""}`}
                onClick={() => setActiveTab("watched")}
              >
                ✅ Watched ({watchedCount})
              </button>
            </div>
          </div>

          {/* Results Summary & Tip */}
          <div className="watchlist-meta-summary">
            <span className="summary-count">
              Showing <strong>{filteredFavorites.length}</strong> of{" "}
              <strong>{favorites.length}</strong> saved {favorites.length === 1 ? "title" : "titles"}
            </span>
            <span className="summary-tip">
              💡 Tip: Click the love/check button on any card to <strong>Remove</strong> or <strong>Move to Watched</strong>.
            </span>
          </div>

          {/* Grid or Empty Search State */}
          {filteredFavorites.length === 0 ? (
            <div className="favorites-empty-search">
              <span className="empty-search-icon">🔍</span>
              <h3>No matching titles found</h3>
              <p>No saved movies match your search for "{searchQuery}".</p>
              <button
                type="button"
                className="reset-search-btn"
                onClick={handleClearSearch}
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="favorites-grid">
              {filteredFavorites.map((movie) => (
                <MovieCard key={movie.imdbID} movie={movie} />
              ))}
            </div>
          )}
        </>
      ) : (
        /* Empty Watchlist State */
        <div className="favorites-empty">
          <div className="empty-heart-icon">❤️</div>
          <h2>Your Watchlist is Empty</h2>
          <p>
            You haven't saved any movies or TV series yet. Browse the catalog and
            click the heart icon on any title to save it to your watchlist!
          </p>
          <Link to="/" className="explore-btn">
            Explore Movies
          </Link>
        </div>
      )}
    </div>
  );
}
