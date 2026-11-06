import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useFavorites } from "../../context/FavoritesContext";
import "./MovieCard.css";

export default function MovieCard({ movie }) {
  const { isFavorite, isWatched, addFavorite, removeFavorite, toggleWatched } = useFavorites();
  const [imageError, setImageError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const favorited = isFavorite(movie.imdbID);
  const watched = isWatched(movie.imdbID);
  const hasPoster = movie.Poster && movie.Poster !== "N/A" && !imageError;

  const handleHeartClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!favorited) {
      // Add directly to watchlist
      addFavorite(movie, false);
    } else {
      // Toggle manage action overlay
      setShowMenu((prev) => !prev);
    }
  };

  const handleRemoveFromWatchlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    removeFavorite(movie.imdbID);
    setShowMenu(false);
  };

  const handleMoveToWatched = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWatched(movie.imdbID);
    setShowMenu(false);
  };

  const handleCloseMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(false);
  };

  return (
    <div className="movie-card">
      <Link to={`/movie/${movie.imdbID}`} className="card-link">
        <div className="poster-container">
          {hasPoster ? (
            <img
              src={movie.Poster}
              alt={movie.Title}
              className="poster-img"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="poster-placeholder">
              <span className="placeholder-icon">🎬</span>
              <span className="placeholder-text">No Poster Available</span>
            </div>
          )}

          <div className="poster-overlay">
            <span className="view-details-pill">View Details</span>
          </div>

          {/* Heart / Love Action Button */}
          <button
            type="button"
            className={`fav-btn ${favorited ? "is-fav" : ""} ${watched ? "is-watched" : ""}`}
            onClick={handleHeartClick}
            aria-label={
              favorited
                ? watched
                  ? "Watched (click for options)"
                  : "In Watchlist (click for options)"
                : "Add to Watchlist"
            }
            title={
              favorited
                ? watched
                  ? "Marked as Watched — click to manage"
                  : "In Watchlist — click to manage"
                : "Add to Watchlist"
            }
          >
            {favorited ? (watched ? "✅" : "❤️") : "🤍"}
          </button>

          {/* Watched Status Badge */}
          {watched && (
            <span className="watched-badge">
              ✓ Watched
            </span>
          )}

          {/* Type Badge */}
          {movie.Type && (
            <span className="type-badge">
              {movie.Type.toUpperCase()}
            </span>
          )}
        </div>

        <div className="card-info">
          <div className="card-header">
            <span className="card-year">{movie.Year || "—"}</span>
          </div>
          <h3 className="card-title" title={movie.Title}>
            {movie.Title}
          </h3>
        </div>
      </Link>

      {/* Modern In-Card Action Sheet Overlay (Never overflows or gets clipped) */}
      {showMenu && (
        <div className="card-action-overlay" onClick={handleCloseMenu}>
          <div className="card-action-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="card-action-close"
              onClick={handleCloseMenu}
              aria-label="Close"
            >
              ✕
            </button>

            <span className="card-action-subtitle">Manage Title</span>
            <h4 className="card-action-title">{movie.Title}</h4>

            <div className="card-action-buttons">
              <button
                type="button"
                className="action-pill-btn remove-btn"
                onClick={handleRemoveFromWatchlist}
              >
                <span className="action-pill-icon">🗑️</span>
                <span>Remove from Watchlist</span>
              </button>

              <button
                type="button"
                className={`action-pill-btn watched-btn ${watched ? "is-watched" : ""}`}
                onClick={handleMoveToWatched}
              >
                <span className="action-pill-icon">{watched ? "⏳" : "✅"}</span>
                <span>{watched ? "Move to To-Watch" : "Move to Watched"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
