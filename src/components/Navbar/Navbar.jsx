import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useFavorites } from "../../context/FavoritesContext";
import "./Navbar.css";

export default function Navbar() {
  const { favorites } = useFavorites();
  const location = useLocation();

  return (
    <header className="navbar-container">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🎬</span>
          <span className="logo-text">
            Cine<span className="gradient-text">Scope</span>
          </span>
        </Link>

        <nav className="navbar-links">
          <Link
            to="/"
            className={`nav-link ${location.pathname === "/" ? "active" : ""}`}
          >
            <span>Explore</span>
          </Link>
          <Link
            to="/favorites"
            className={`nav-link favorites-link ${
              location.pathname === "/favorites" ? "active" : ""
            }`}
          >
            <span>Favorites</span>
            {favorites.length > 0 && (
              <span className="favorites-badge">{favorites.length}</span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}

