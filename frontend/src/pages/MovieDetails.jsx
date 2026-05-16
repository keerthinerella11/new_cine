// src/pages/MovieDetails.jsx
import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import "./Home.css";

// ✅ Use your new TMDB API key
const API_KEY = import.meta.env.VITE_TMDB_KEY || "eeec6858ccc8ea28e5972fba3c3e55c4";

// ✅ Use backend URL from env (works for Render + local)
const BACKEND_URL = import.meta.env.VITE_API_URL || "https://cinezone-project-main.onrender.com";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

// ✅ Helper function to get current user email from localStorage
const getCurrentUserEmail = () => localStorage.getItem("userEmail") || "guest";

function MovieDetails() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(state?.movie || null);
  const [loading, setLoading] = useState(
    !state?.movie || (state?.movie?.id && !isNaN(state.movie.id) && !state.movie.runtime)
  );
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [trailer, setTrailer] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editedReview, setEditedReview] = useState({ rating: 5, comment: "" });

  // ✅ Fetch user's favorites
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const userEmail = getCurrentUserEmail();
        const encodedUser = encodeURIComponent(userEmail);
        const res = await fetch(`${BACKEND_URL}/api/favorites?user=${encodedUser}`);
        if (!res.ok) {
          console.warn(`Favorites API returned ${res.status}`);
          setFavorites([]);
          return;
        }
        const data = await res.json();
        if (Array.isArray(data)) {
          setFavorites(data.map((fav) => fav.movieId));
        } else {
          console.warn("Favorites API returned non-array response:", data);
          setFavorites([]);
        }
      } catch (err) {
        console.error("Error fetching favorites:", err);
        setFavorites([]);
      }
    };
    fetchFavorites();
  }, []);

  // ✅ Toggle Like / Unlike
  const toggleFavorite = async (movieToLike) => {
    const isFav = favorites.includes(movieToLike.id);

    if (isFav) {
      setFavorites((prev) => prev.filter((id) => id !== movieToLike.id));
      try {
        const userEmail = getCurrentUserEmail();
        const encodedUser = encodeURIComponent(userEmail);
        await fetch(`${BACKEND_URL}/api/favorites/${movieToLike.id}?user=${encodedUser}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.error("Error removing favorite:", err);
        setFavorites((prev) => [...prev, movieToLike.id]);
      }
    } else {
      setFavorites((prev) => [...prev, movieToLike.id]);
      try {
        await fetch(`${BACKEND_URL}/api/favorites`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            movieId: movieToLike.id,
            title: movieToLike.title,
            poster: movieToLike.poster_path,
            rating: movieToLike.vote_average,
            likedBy: getCurrentUserEmail(),
          }),
        });
      } catch (err) {
        console.error("Error adding favorite:", err);
        setFavorites((prev) => prev.filter((id) => id !== movieToLike.id));
      }
    }
  };

  // ✅ Fetch reviews for the current movie ID as soon as the page loads
  useEffect(() => {
    if (!id) return;

    const fetchReviews = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/reviews/${id}`);
        if (!res.ok) throw new Error("Failed to fetch reviews");
        const data = await res.json();
        if (Array.isArray(data)) {
          setReviews(data);
        }
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setReviews([]); // Set empty array on error
      }
    };

    fetchReviews();
  }, [id]);

  // ✅ Submit review (Optional - only for interested users)
  const submitReview = async (e) => {
    e.preventDefault();
    if (!newReview.comment.trim()) {
      alert("Please write a review comment");
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieId: movie.id,
          userEmail: getCurrentUserEmail(),
          rating: newReview.rating,
          comment: newReview.comment,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      if (data.review) {
        setReviews([data.review, ...reviews]);
        setNewReview({ rating: 5, comment: "" });
        setShowReviewForm(false);
        alert("✅ Review submitted successfully!");
      } else {
        alert("Review saved but couldn't reload reviews.");
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      alert("❌ Failed to submit review. Please try again.");
    }
  };

  // ✅ Delete review
  const deleteReview = async (reviewId, index) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/reviews/${reviewId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) throw new Error("Failed to delete review");
        setReviews(reviews.filter((_, i) => i !== index));
        alert("✅ Review deleted successfully!");
      } catch (err) {
        console.error("Error deleting review:", err);
        alert("❌ Failed to delete review. Please try again.");
      }
    }
  };

  // ✅ Update review
  const updateReview = async (e, reviewId, index) => {
    e.preventDefault();
    if (!editedReview.comment.trim()) {
      alert("Please write a review comment");
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/reviews/${reviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: editedReview.rating,
          comment: editedReview.comment,
        }),
      });

      if (!res.ok) throw new Error("Failed to update review");
      const updatedReviewData = await res.json();
      const updatedReviews = [...reviews];
      updatedReviews[index] = updatedReviewData.review || { ...reviews[index], rating: editedReview.rating, comment: editedReview.comment };
      setReviews(updatedReviews);
      setEditingReviewId(null);
      setEditedReview({ rating: 5, comment: "" });
      alert("✅ Review updated successfully!");
    } catch (err) {
      console.error("Error updating review:", err);
      alert("❌ Failed to update review. Please try again.");
    }
  };

  // ✅ Fetch full movie details when needed
  useEffect(() => {
    const shouldFetch = () => {
      if (!movie && id) return true;
      if (movie && movie.id && !isNaN(movie.id) && !movie.runtime) return true;
      return false;
    };

    if (!shouldFetch()) return;

    const fetchMovie = async () => {
      setLoading(true);
      try {
        let movieData;
        let movieId = id;

        if (movie && movie.id && !isNaN(movie.id)) {
          movieId = movie.id;
        }

        // If id is not a number, search by title
        if (isNaN(movieId)) {
          const searchRes = await fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(movieId)}&language=en-US`
          );
          const searchData = await searchRes.json();
          if (searchData.results && searchData.results.length > 0) {
            movieId = searchData.results[0].id;
          } else {
            setError("Movie not found.");
            setLoading(false);
            return;
          }
        }

        const res = await fetch(
          `https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&language=en-US`
        );
        movieData = await res.json();
        setMovie(movieData);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch movie details:", err);
        setError("Failed to fetch movie details.");
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id, movie]);

  // ✅ Fetch trailer when movie is available
  useEffect(() => {
    if (movie && movie.id && !isNaN(movie.id)) {
      const fetchTrailer = async () => {
        try {
          const videoRes = await fetch(
            `https://api.themoviedb.org/3/movie/${movie.id}/videos?api_key=${API_KEY}&language=en-US`
          );
          const videoData = await videoRes.json();
          const trailerVideo = videoData.results.find(
            (video) => video.type === "Trailer" && video.site === "YouTube"
          );
          setTrailer(trailerVideo);
        } catch (err) {
          console.error("Failed to fetch trailer:", err);
        }
      };
      fetchTrailer();
    }
  }, [movie]);

  if (loading) return <h2 style={{ textAlign: "center" }}>Loading movie details...</h2>;
  if (error) return <h2 style={{ textAlign: "center" }}>{error}</h2>;
  if (!movie)
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <h2>Movie details not found</h2>
        <button
          onClick={() => navigate("/home")}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            background: "#00adb5",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          ← Back to Home
        </button>
      </div>
    );

  return (
    <section className="movie-details-section">
      <div className="movie-details-card">
        <img
          src={
            movie.poster_path
              ? `${IMAGE_BASE_URL}${movie.poster_path}`
              : movie.img
              ? movie.img
              : "https://via.placeholder.com/250x350?text=No+Image"
          }
          alt={movie.title}
          style={{ maxWidth: "250px", borderRadius: "10px", marginBottom: "20px" }}
        />

        <h2>{movie.title}</h2>
        {movie.tagline && <p><em>"{movie.tagline}"</em></p>}
        <p><strong>Synopsis:</strong> {movie.overview || movie.synopsis}</p>
        <p><strong>Release Date:</strong> {movie.release_date}</p>
        <p><strong>Rating:</strong> ⭐ {movie.vote_average || movie.rating || "N/A"} / 10</p>
        <p>
          <strong>Runtime:</strong> {
            movie.runtime
              ? `${movie.runtime} min`
              : movie.runningTime
              ? movie.runningTime
              : "N/A"
          }
        </p>
        <p>
          <strong>Genres:</strong> {
            movie.genres
              ? movie.genres.map((g) => g.name).join(", ")
              : movie.genre
              ? movie.genre
              : movie.genre_names
              ? movie.genre_names.join(", ")
              : "N/A"
          }
        </p>
        <p>
          <strong>Language:</strong> {
            movie.original_language
              ? movie.original_language.toUpperCase()
              : movie.language
              ? movie.language.toUpperCase()
              : "N/A"
          }
        </p>

        {trailer && (
          <div style={{ marginTop: "20px" }}>
            <h3>Trailer</h3>
            <iframe
              width="560"
              height="315"
              src={`https://www.youtube.com/embed/${trailer.key}`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        )}

        <button
          onClick={() => toggleFavorite(movie)}
          className={`like-button ${favorites.includes(movie.id) ? "liked" : ""}`}
          style={{ marginTop: "10px" }}
        >
          {favorites.includes(movie.id) ? "❤️ Liked" : "🤍 Like"}
        </button>

        <button
          onClick={() => setShowReviewForm(!showReviewForm)}
          style={{
            marginTop: "10px",
            marginLeft: "10px",
            padding: "10px 20px",
            background: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          {showReviewForm ? "❌ Cancel" : "💬 Write a Review (Optional)"}
        </button>

        {showReviewForm && (
          <form onSubmit={submitReview} style={{ marginTop: "20px", padding: "15px", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
            <h3>📝 Share Your Review (Optional)</h3>
            <p style={{ fontSize: "14px", color: "#666" }}>Your review helps other users discover great movies!</p>
            <label style={{ display: "block", marginBottom: "10px" }}>
              <strong>Rating:</strong>
              <select
                value={newReview.rating}
                onChange={(e) => setNewReview({ ...newReview, rating: Number(e.target.value) })}
                style={{ marginLeft: "10px", padding: "5px" }}
              >
                {[1, 2, 3, 4, 5].map((r) => (
                  <option key={r} value={r}>
                    {r} Star{r > 1 ? "s" : ""} {"⭐".repeat(r)}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "block", marginBottom: "10px" }}>
              <strong>Your Review:</strong>
              <textarea
                placeholder="Share your thoughts about this movie..."
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                rows="4"
                style={{ width: "100%", marginTop: "5px", padding: "8px", fontFamily: "Arial", fontSize: "14px" }}
                required
              />
            </label>
            <button
              type="submit"
              style={{
                padding: "10px 20px",
                background: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              ✓ Submit Review
            </button>
          </form>
        )}

        <div style={{ marginTop: "30px" }}>
          <h3>All User Reviews</h3>
          <p style={{ marginBottom: "10px", color: "#555" }}>
            Showing reviews from all users for this movie ({reviews.length} review{reviews.length === 1 ? "" : "s"}).
          </p>
          {reviews.length === 0 ? (
            <p>No reviews yet. Be the first to review!</p>
          ) : (
            reviews.map((review, index) => (
              <div
                key={index}
                style={{
                  border: "1px solid #ddd",
                  padding: "15px",
                  marginBottom: "15px",
                  borderRadius: "8px",
                  backgroundColor: "#f0e8ff",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  color: "#000",
                }}
              >
                {editingReviewId === index ? (
                  // Edit form
                  <form onSubmit={(e) => updateReview(e, review._id, index)} style={{ marginBottom: "10px" }}>
                    <label style={{ display: "block", marginBottom: "10px" }}>
                      <strong>Rating:</strong>
                      <select
                        value={editedReview.rating}
                        onChange={(e) => setEditedReview({ ...editedReview, rating: Number(e.target.value) })}
                        style={{ marginLeft: "10px", padding: "5px" }}
                      >
                        {[1, 2, 3, 4, 5].map((r) => (
                          <option key={r} value={r}>
                            {r} Star{r > 1 ? "s" : ""} {"⭐".repeat(r)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label style={{ display: "block", marginBottom: "10px" }}>
                      <strong>Your Review:</strong>
                      <textarea
                        value={editedReview.comment}
                        onChange={(e) => setEditedReview({ ...editedReview, comment: e.target.value })}
                        rows="3"
                        style={{ width: "100%", marginTop: "5px", padding: "8px", fontFamily: "Arial", fontSize: "14px" }}
                        required
                      />
                    </label>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        type="submit"
                        style={{
                          padding: "8px 16px",
                          background: "#28a745",
                          color: "white",
                          border: "none",
                          borderRadius: "5px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "bold",
                        }}
                      >
                        ✓ Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingReviewId(null)}
                        style={{
                          padding: "8px 16px",
                          background: "#6c757d",
                          color: "white",
                          border: "none",
                          borderRadius: "5px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "bold",
                        }}
                      >
                        ✗ Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  // Display review
                  <>
                    <p>
                      <strong>{review.userEmail}</strong> - ⭐ {review.rating}/5
                    </p>
                    <p>{review.comment}</p>
                    <small>{new Date(review.createdAt).toLocaleDateString()}</small>
                    {review.userEmail === getCurrentUserEmail() && (
                      <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
                        <button
                          onClick={() => {
                            setEditingReviewId(index);
                            setEditedReview({ rating: review.rating, comment: review.comment });
                          }}
                          style={{
                            padding: "6px 12px",
                            background: "#ffc107",
                            color: "black",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: "bold",
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => deleteReview(review._id, index)}
                          style={{
                            padding: "6px 12px",
                            background: "#dc3545",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: "bold",
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>

        <button
          onClick={() => navigate("/home")}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            background: "#00adb5",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          ← Back to Home
        </button>
      </div>
    </section>
  );
}

export default MovieDetails;
