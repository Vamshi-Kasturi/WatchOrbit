import React, { createContext, useContext, useState, useEffect } from "react";

const FavoritesContext = createContext();

const FAVORITES_STORAGE_KEY = "cinescope_favorites_v1";

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to load favorites from localStorage", e);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.error("Failed to save favorites to localStorage", e);
    }
  }, [favorites]);

  const addFavorite = (movie, watched = false) => {
    setFavorites((prev) => {
      if (prev.some((item) => item.imdbID === movie.imdbID)) {
        return prev;
      }
      return [
        {
          imdbID: movie.imdbID,
          Title: movie.Title,
          Year: movie.Year,
          Poster: movie.Poster,
          Type: movie.Type || "movie",
          Genre: movie.Genre || "",
          imdbRating: movie.imdbRating || "N/A",
          watched: watched,
        },
        ...prev,
      ];
    });
  };

  const removeFavorite = (imdbID) => {
    setFavorites((prev) => prev.filter((item) => item.imdbID !== imdbID));
  };

  const setWatchedStatus = (imdbID, watched = true) => {
    setFavorites((prev) =>
      prev.map((item) =>
        item.imdbID === imdbID ? { ...item, watched: watched } : item
      )
    );
  };

  const toggleWatched = (imdbID) => {
    setFavorites((prev) =>
      prev.map((item) =>
        item.imdbID === imdbID ? { ...item, watched: !item.watched } : item
      )
    );
  };

  const isFavorite = (imdbID) => {
    return favorites.some((item) => item.imdbID === imdbID);
  };

  const isWatched = (imdbID) => {
    const item = favorites.find((m) => m.imdbID === imdbID);
    return item ? !!item.watched : false;
  };

  const clearFavorites = () => {
    setFavorites([]);
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addFavorite,
        removeFavorite,
        setWatchedStatus,
        toggleWatched,
        isFavorite,
        isWatched,
        clearFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
