import React, { useEffect, useState, useMemo } from "react";
import MovieCard from "../../components/MovieCard/MovieCard";
import MovieCardSkeleton from "../../components/MovieCard/MovieCardSkeleton";
import Pagination from "../../components/Pagination/Pagination";
import "./Home.css";

const POPULAR_SUGGESTIONS = [
  "Avengers",
  "Batman",
  "Spider-Man",
  "Inception",
  "Interstellar",
  "Stranger Things",
];

const RECENT_SEARCHES_KEY = "watchorbit_recent_searches";

export default function Home() {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("Avengers");
  const [typeFilter, setTypeFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [page, setPage] = useState(1);

  const [movies, setMovies] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const stored =
        localStorage.getItem(RECENT_SEARCHES_KEY) ||
        localStorage.getItem("cinescope_recent_searches");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const apikey = import.meta.env.VITE_OMDB_API_KEY;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchInput.trim();
      if (trimmed.length > 0) {
        setDebouncedQuery(trimmed);
        setPage(1);

        // Update recent searches
        setRecentSearches((prev) => {
          const updated = [
            trimmed,
            ...prev.filter((q) => q.toLowerCase() !== trimmed.toLowerCase()),
          ].slice(0, 5);
          try {
            localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
          } catch {}
          return updated;
        });
      } else if (searchInput === "") {
        // Fall back to default showcase
        setDebouncedQuery("Avengers");
        setPage(1);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch movies from OMDb
  useEffect(() => {
    let isCancelled = false;

    const fetchMovies = async () => {
      if (!apikey) {
        setError("OMDb API key is missing. Please check your .env configuration.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let url = `https://www.omdbapi.com/?apikey=${apikey}&s=${encodeURIComponent(
          debouncedQuery
        )}&page=${page}`;

        if (typeFilter) url += `&type=${typeFilter}`;
        if (yearFilter && yearFilter.length === 4) url += `&y=${yearFilter}`;

        const res = await fetch(url);
        const data = await res.json();

        if (isCancelled) return;

        if (data.Response === "True") {
          setMovies(data.Search || []);
          setTotalResults(parseInt(data.totalResults, 10) || 0);
          setError(null);
        } else {
          setMovies([]);
          setTotalResults(0);
          setError(data.Error || "No movies found matching your criteria.");
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("Fetch error:", err);
          setError("Failed to fetch movies. Please check your internet connection.");
          setMovies([]);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchMovies();

    return () => {
      isCancelled = true;
    };
  }, [debouncedQuery, typeFilter, yearFilter, page, apikey]);

  const handleSelectSuggestion = (title) => {
    setSearchInput(title);
    setDebouncedQuery(title);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setDebouncedQuery("Avengers");
    setPage(1);
  };

  const handleTypeChange = (newType) => {
    setTypeFilter(newType);
    setPage(1);
  };

  const handleYearChange = (e) => {
    setYearFilter(e.target.value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setTypeFilter("");
    setYearFilter("");
    setPage(1);
  };

  const totalPages = useMemo(() => {
    return Math.ceil(totalResults / 10);
  }, [totalResults]);

  const isShowingDefault = searchInput.trim() === "";

  return (
    <div className="home-container">
      {/* Hero Header */}
      <section className="hero-section">
        <h1 className="hero-title">
          Discover <span className="gradient-text">Cinema</span> & Entertainment
        </h1>
        <p className="hero-subtitle">
          Search thousands of movies, TV shows, and series with full IMDb ratings and cast details.
        </p>

        {/* Search Bar */}
        <div className="search-box-wrapper">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by title (e.g. Inception, Batman)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="search-input"
            />
            {searchInput && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Suggestion Chips */}
        <div className="suggestions-container">
          <span className="suggestions-label">Trending:</span>
          <div className="chips-list">
            {POPULAR_SUGGESTIONS.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`chip ${debouncedQuery.toLowerCase() === tag.toLowerCase() ? "chip-active" : ""}`}
                onClick={() => handleSelectSuggestion(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Searches (if any) */}
        {recentSearches.length > 0 && !isShowingDefault && (
          <div className="suggestions-container recent-container">
            <span className="suggestions-label">Recent:</span>
            <div className="chips-list">
              {recentSearches.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="chip chip-recent"
                  onClick={() => handleSelectSuggestion(tag)}
                >
                  🕒 {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Filter Toolbar */}
      <section className="filter-section">
        <div className="filter-group">
          <span className="filter-label">Type:</span>
          <div className="type-buttons">
            <button
              type="button"
              className={`filter-btn ${typeFilter === "" ? "active" : ""}`}
              onClick={() => handleTypeChange("")}
            >
              All
            </button>
            <button
              type="button"
              className={`filter-btn ${typeFilter === "movie" ? "active" : ""}`}
              onClick={() => handleTypeChange("movie")}
            >
              Movies
            </button>
            <button
              type="button"
              className={`filter-btn ${typeFilter === "series" ? "active" : ""}`}
              onClick={() => handleTypeChange("series")}
            >
              Series
            </button>
            <button
              type="button"
              className={`filter-btn ${typeFilter === "episode" ? "active" : ""}`}
              onClick={() => handleTypeChange("episode")}
            >
              Episodes
            </button>
          </div>
        </div>

        <div className="filter-group year-group">
          <label htmlFor="year-input" className="filter-label">Year:</label>
          <input
            id="year-input"
            type="number"
            placeholder="e.g. 2023"
            min="1900"
            max="2099"
            value={yearFilter}
            onChange={handleYearChange}
            className="year-input"
          />
        </div>

        {(typeFilter || yearFilter) && (
          <button
            type="button"
            className="clear-filters-btn"
            onClick={handleClearFilters}
          >
            Reset Filters
          </button>
        )}
      </section>

      {/* Results Header */}
      <div className="results-header">
        <h2 className="results-title">
          {isShowingDefault ? "✨ Featured & Trending" : `Results for "${debouncedQuery}"`}
        </h2>
        {totalResults > 0 && !loading && (
          <span className="results-count">
            Found <strong>{totalResults}</strong> {totalResults === 1 ? "title" : "titles"}
          </span>
        )}
      </div>

      {/* Movies Grid */}
      <section className="movies-grid-section">
        {loading ? (
          <div className="movies-grid">
            {Array.from({ length: 8 }).map((_, idx) => (
              <MovieCardSkeleton key={idx} />
            ))}
          </div>
        ) : error ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎬</div>
            <h3 className="empty-title">No Movies Found</h3>
            <p className="empty-description">{error}</p>
            <button
              type="button"
              className="retry-btn"
              onClick={handleClearSearch}
            >
              Reset Search
            </button>
          </div>
        ) : (
          <>
            <div className="movies-grid">
              {movies.map((movie) => (
                <MovieCard key={movie.imdbID} movie={movie} />
              ))}
            </div>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(newPage) => {
                setPage(newPage);
                window.scrollTo({ top: 400, behavior: "smooth" });
              }}
            />
          </>
        )}
      </section>
    </div>
  );
}
