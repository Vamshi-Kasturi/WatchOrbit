import React from "react";
import "./MovieCardSkeleton.css";

export default function MovieCardSkeleton() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-poster shimmer"></div>
      <div className="skeleton-info">
        <div className="skeleton-badge shimmer"></div>
        <div className="skeleton-title shimmer"></div>
        <div className="skeleton-title-short shimmer"></div>
      </div>
    </div>
  );
}

