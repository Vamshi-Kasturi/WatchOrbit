import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useFavorites } from "../../context/FavoritesContext";
import { fetchStreamingAvailability } from "../../services/streamingService";
import "./MovieDetails.css";

export default function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isFavorite, isWatched, addFavorite, removeFavorite, toggleWatched } = useFavorites();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [showFavMenu, setShowFavMenu] = useState(false);
  const favMenuRef = useRef(null);

  // Streaming availability state (Independent of TMDB, powered by JustWatch proxy)
  const [selectedRegion, setSelectedRegion] = useState("IN");
  const [streamingData, setStreamingData] = useState(null);
  const [loadingStreaming, setLoadingStreaming] = useState(false);

  const apikey = import.meta.env.VITE_OMDB_API_KEY;

  // 1. Fetch movie info from OMDb
  useEffect(() => {
    let isCancelled = false;

    const fetchMovieDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const isImdbId = id?.startsWith("tt");
        const queryParam = isImdbId ? `i=${id}` : `t=${encodeURIComponent(id)}`;
        const url = `https://www.omdbapi.com/?apikey=${apikey}&${queryParam}&plot=full`;

        const response = await fetch(url);
        const data = await response.json();

        if (isCancelled) return;

        if (data.Response === "True") {
          setMovie(data);
        } else {
          setError(data.Error || "Movie details could not be found.");
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("Error fetching movie details:", err);
          setError("Failed to load movie details. Please try again.");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchMovieDetails();

    return () => {
      isCancelled = true;
    };
  }, [id, apikey]);

  // 2. Fetch live streaming availability whenever movie or region changes
  useEffect(() => {
    if (!movie?.Title) return;

    let isCancelled = false;

    const loadStreaming = async () => {
      setLoadingStreaming(true);
      const result = await fetchStreamingAvailability(movie.Title, selectedRegion);

      if (!isCancelled) {
        setStreamingData(result);
        setLoadingStreaming(false);
      }
    };

    loadStreaming();

    return () => {
      isCancelled = true;
    };
  }, [movie?.Title, selectedRegion]);

  const favorited = movie ? isFavorite(movie.imdbID) : false;
  const watched = movie ? isWatched(movie.imdbID) : false;

  useEffect(() => {
    if (!showFavMenu) return;
    const handleClickOutside = (e) => {
      if (favMenuRef.current && !favMenuRef.current.contains(e.target)) {
        setShowFavMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFavMenu]);

  const handleFavoriteToggle = () => {
    if (!movie) return;
    if (!favorited) {
      addFavorite(movie);
    } else {
      setShowFavMenu((prev) => !prev);
    }
  };

  const getRottenTomatoesRating = () => {
    if (!movie?.Ratings) return null;
    const rt = movie.Ratings.find((r) => r.Source === "Rotten Tomatoes");
    return rt ? rt.Value : null;
  };

  if (loading) {
    return (
      <div className="details-container">
        <div className="details-loading-spinner">
          <div className="spinner"></div>
          <p>Loading movie information...</p>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="details-container">
        <div className="details-error-card">
          <span className="error-icon">⚠️</span>
          <h2>Oops! Something went wrong</h2>
          <p>{error || "Movie not found"}</p>
          <button
            type="button"
            className="back-btn"
            onClick={() => navigate(-1)}
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  const hasPoster = movie.Poster && movie.Poster !== "N/A" && !imageError;
  const rottenTomatoes = getRottenTomatoesRating();
  const trailerSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${movie.Title} ${movie.Year} trailer`
  )}`;

  const justWatchSearchUrl = `https://www.justwatch.com/${selectedRegion.toLowerCase()}/search?q=${encodeURIComponent(
    movie.Title
  )}`;

  const streamPlatforms = streamingData?.stream || [];
  const rentPlatforms = streamingData?.rent || [];
  const buyPlatforms = streamingData?.buy || [];
  const hasAnyPlatform = streamPlatforms.length > 0 || rentPlatforms.length > 0;

  return (
    <div className="details-container">
      {/* Back button */}
      <button
        type="button"
        className="back-nav-btn"
        onClick={() => navigate(-1)}
      >
        ← Back to Browse
      </button>

      <div className="details-card">
        {/* Left column: Poster & Quick Actions */}
        <div className="details-left">
          <div className="details-poster-box">
            {hasPoster ? (
              <img
                src={movie.Poster}
                alt={movie.Title}
                className="details-poster-img"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="details-poster-placeholder">
                <span className="placeholder-icon">🎬</span>
                <span>No Poster Available</span>
              </div>
            )}
          </div>

          <div className="action-buttons">
            <div className="details-fav-wrapper" ref={favMenuRef}>
              <button
                type="button"
                className={`details-fav-btn ${favorited ? "is-fav" : ""} ${watched ? "is-watched" : ""}`}
                onClick={handleFavoriteToggle}
              >
                {favorited ? (watched ? "✅ Watched" : "❤️ In Watchlist") : "🤍 Add to Watchlist"}
              </button>

              {/* Two Options Popover for Details Page */}
              {showFavMenu && (
                <div className="details-fav-popover">
                  <button
                    type="button"
                    className="popover-item remove-item"
                    onClick={() => {
                      removeFavorite(movie.imdbID);
                      setShowFavMenu(false);
                    }}
                  >
                    <span className="popover-item-icon">🗑️</span>
                    <div className="popover-item-text">
                      <strong>Remove from Watchlist</strong>
                      <small>Delete from saved titles</small>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`popover-item watched-item ${watched ? "active" : ""}`}
                    onClick={() => {
                      toggleWatched(movie.imdbID);
                      setShowFavMenu(false);
                    }}
                  >
                    <span className="popover-item-icon">{watched ? "⏳" : "✅"}</span>
                    <div className="popover-item-text">
                      <strong>{watched ? "Move to To-Watch" : "Move to Watched"}</strong>
                      <small>{watched ? "Mark as uncompleted" : "Mark as completed"}</small>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <a
              href={trailerSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="trailer-btn"
            >
              ▶ Watch Trailer on YouTube
            </a>
          </div>
        </div>

        {/* Right column: Movie Content */}
        <div className="details-right">
          <div className="header-meta">
            <span className="details-type">{movie.Type?.toUpperCase()}</span>
            {movie.Rated && movie.Rated !== "N/A" && (
              <span className="details-rated">{movie.Rated}</span>
            )}
            <span className="details-runtime">{movie.Runtime}</span>
          </div>

          <h1 className="details-title">
            {movie.Title} <span className="details-year">({movie.Year})</span>
          </h1>

          {/* Ratings Ribbon */}
          <div className="ratings-ribbon">
            {movie.imdbRating && movie.imdbRating !== "N/A" && (
              <div className="rating-badge imdb-badge">
                <span className="star-icon">⭐</span>
                <div>
                  <div className="rating-value">{movie.imdbRating} / 10</div>
                  <div className="rating-sub">{movie.imdbVotes || "N/A"} votes</div>
                </div>
              </div>
            )}

            {rottenTomatoes && (
              <div className="rating-badge rt-badge">
                <span className="tomato-icon">🍅</span>
                <div>
                  <div className="rating-value">{rottenTomatoes}</div>
                  <div className="rating-sub">Rotten Tomatoes</div>
                </div>
              </div>
            )}

            {movie.Metascore && movie.Metascore !== "N/A" && (
              <div className="rating-badge meta-badge">
                <span className="meta-icon">Ⓜ️</span>
                <div>
                  <div className="rating-value">{movie.Metascore} / 100</div>
                  <div className="rating-sub">Metascore</div>
                </div>
              </div>
            )}
          </div>

          {/* Genre Chips */}
          {movie.Genre && movie.Genre !== "N/A" && (
            <div className="genre-list">
              {movie.Genre.split(",").map((genre) => (
                <span key={genre.trim()} className="genre-tag">
                  {genre.trim()}
                </span>
              ))}
            </div>
          )}

          {/* ============================================================== */}
          {/* OTT STREAMING AVAILABILITY SECTION (LIVE JUSTWATCH DIRECT) */}
          {/* ============================================================== */}
          <div className="ott-section">
            <div className="ott-header">
              <div className="ott-title-wrapper">
                <span className="ott-icon-badge">📺</span>
                <div>
                  <h3 className="ott-heading">Where to Watch (OTT)</h3>
                  <p className="ott-subheading">
                    Verified streaming platforms & direct links for "{movie.Title}"
                  </p>
                </div>
              </div>

              {/* Region Selector */}
              <div className="ott-controls">
                <div className="region-selector">
                  <span className="region-label">Region:</span>
                  <button
                    type="button"
                    className={`region-btn ${selectedRegion === "IN" ? "active" : ""}`}
                    onClick={() => setSelectedRegion("IN")}
                  >
                    🇮🇳 India
                  </button>
                  <button
                    type="button"
                    className={`region-btn ${selectedRegion === "US" ? "active" : ""}`}
                    onClick={() => setSelectedRegion("US")}
                  >
                    🇺🇸 US
                  </button>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loadingStreaming ? (
              <div className="ott-loading-bar">
                <div className="ott-pulse-dot"></div>
                <span>Checking live streaming availability in {selectedRegion === "IN" ? "India" : "the US"}...</span>
              </div>
            ) : hasAnyPlatform ? (
              <div className="ott-results-container">
                {/* 1. Subscription / Free Streaming */}
                {streamPlatforms.length > 0 && (
                  <div className="ott-stream-category">
                    <span className="ott-category-badge stream-badge">
                      {streamingData?.isStaticFallback
                        ? "🔗 Quick-Launch Streaming Platforms"
                        : "🟢 Stream Now (Subscription / Free)"}
                    </span>
                    <div className="ott-cards-list">
                      {streamPlatforms.map((platform) => (
                        <a
                          key={platform.name}
                          href={platform.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ott-provider-card"
                          title={`Watch on ${platform.name}`}
                        >
                          {platform.icon ? (
                            <img
                              src={platform.icon}
                              alt={platform.name}
                              className="ott-provider-icon"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          ) : (
                            <span className="ott-icon-placeholder">🎬</span>
                          )}
                          <div className="ott-provider-meta">
                            <span className="ott-provider-name">{platform.name}</span>
                            <span className="ott-provider-sub">Stream Now ↗</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Rent / Buy Platforms */}
                {rentPlatforms.length > 0 && (
                  <div className="ott-stream-category">
                    <span className="ott-category-badge rent-badge">
                      🟡 Available to Rent / Buy
                    </span>
                    <div className="ott-cards-list">
                      {rentPlatforms.slice(0, 4).map((platform) => (
                        <a
                          key={platform.name}
                          href={platform.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ott-provider-card rent-card"
                          title={`Rent on ${platform.name}`}
                        >
                          {platform.icon ? (
                            <img
                              src={platform.icon}
                              alt={platform.name}
                              className="ott-provider-icon"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          ) : (
                            <span className="ott-icon-placeholder">🎬</span>
                          )}
                          <div className="ott-provider-meta">
                            <span className="ott-provider-name">{platform.name}</span>
                            <span className="ott-provider-sub">Rent / Buy ↗</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="ott-empty-state">
                <span className="ott-empty-icon">ℹ️</span>
                <p className="ott-empty-text">
                  This title is not currently available for subscription streaming in{" "}
                  <strong>{selectedRegion === "IN" ? "India" : "the United States"}</strong>.
                </p>
                <div className="ott-empty-actions">
                  <a
                    href={justWatchSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ott-fallback-btn"
                  >
                    Check Full Availability on JustWatch ↗
                  </a>
                  <a
                    href={`https://play.google.com/store/search?q=${encodeURIComponent(
                      movie.Title
                    )}&c=movies`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ott-fallback-btn secondary"
                  >
                    Search on Google Play Movies ↗
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Plot */}
          <div className="details-section">
            <h3 className="section-title">Plot Overview</h3>
            <p className="plot-text">
              {movie.Plot && movie.Plot !== "N/A"
                ? movie.Plot
                : "No plot summary available for this title."}
            </p>
          </div>

          {/* Cast & Crew Grid */}
          <div className="details-meta-grid">
            <div className="meta-item">
              <span className="meta-label">Director</span>
              <span className="meta-value">{movie.Director || "N/A"}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Writer</span>
              <span className="meta-value">{movie.Writer || "N/A"}</span>
            </div>
            <div className="meta-item full-width">
              <span className="meta-label">Cast & Starring</span>
              <span className="meta-value">{movie.Actors || "N/A"}</span>
            </div>
            {movie.Awards && movie.Awards !== "N/A" && (
              <div className="meta-item full-width awards-item">
                <span className="meta-label">Awards & Honors</span>
                <span className="meta-value">🏆 {movie.Awards}</span>
              </div>
            )}
          </div>

          {/* Extra Details Row */}
          <div className="extra-info-row">
            {movie.BoxOffice && movie.BoxOffice !== "N/A" && (
              <div className="extra-item">
                <span className="extra-label">Box Office:</span>
                <span className="extra-val">{movie.BoxOffice}</span>
              </div>
            )}
            {movie.Country && movie.Country !== "N/A" && (
              <div className="extra-item">
                <span className="extra-label">Country:</span>
                <span className="extra-val">{movie.Country}</span>
              </div>
            )}
            {movie.Language && movie.Language !== "N/A" && (
              <div className="extra-item">
                <span className="extra-label">Language:</span>
                <span className="extra-val">{movie.Language}</span>
              </div>
            )}
            {movie.Released && movie.Released !== "N/A" && (
              <div className="extra-item">
                <span className="extra-label">Released:</span>
                <span className="extra-val">{movie.Released}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
