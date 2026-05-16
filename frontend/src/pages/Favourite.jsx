import { useEffect, useState } from "react";
import axios from "axios";

function Favourite() {
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);

  const userEmail = localStorage.getItem("userEmail") || "";
  const encodedUserEmail = userEmail ? encodeURIComponent(userEmail) : "";
  // ✅ Use env variable with fallback to render.com
  const BACKEND_URL = import.meta.env.VITE_API_URL || "https://cinezone-project-main.onrender.com";

  useEffect(() => {
    if (!userEmail || !BACKEND_URL) {
      setLoading(false);
      return;
    }

    const fetchFavourites = async () => {
      try {
       const res = await axios.get(`${BACKEND_URL}/api/favorites?user=${encodedUserEmail}`);
        // ✅ Ensure data is an array
        if (Array.isArray(res.data)) {
          setFavourites(res.data);
        } else {
          console.warn("⚠️ Favorites API returned non-array response:", res.data);
          setFavourites([]);
        }
      } catch (err) {
        console.error("❌ Error fetching favourites:", err.message);
        setFavourites([]); // ✅ Set empty array on error to prevent .map() crash
      } finally {
        setLoading(false);
      }
    };

    fetchFavourites();
  }, [userEmail, BACKEND_URL]);

  const handleRemove = async (movieId) => {
    try {
      await axios.delete(`${BACKEND_URL}/api/favorites/${movieId}/${encodedUserEmail}`);
      setFavourites(favourites.filter((fav) => fav.movieId !== movieId));
    } catch (err) {
      console.error("❌ Error removing favourite:", err);
    }
  };

  if (loading) return <div className="loading">Loading favourites...</div>;

  return (
    <div
      className="favourite-page"
      style={{
        padding: "40px",
        backgroundColor: "#111",
        minHeight: "100vh",
        color: "#fff",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          marginBottom: "40px",
          fontSize: "1.8rem",
        }}
      >
        ⭐ Your Favourite Movies
      </h2>

      {favourites.length === 0 ? (
        <p
          className="no-favourites"
          style={{ textAlign: "center", color: "#aaa", fontSize: "1.1rem" }}
        >
          You haven’t liked any movies yet.
        </p>
      ) : (
        <div
          className="favourite-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "25px",
            justifyContent: "center",
            alignItems: "stretch",
          }}
        >
          {favourites.map((fav) => (
            <div
              className="favourite-card"
              key={fav._id}
              style={{
                backgroundColor: "#1c1c1c",
                borderRadius: "10px",
                overflow: "hidden",
                boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "transform 0.3s ease",
              }}
            >
              <img
                src={
                  fav.poster
                    ? fav.poster.startsWith("http")
                      ? fav.poster
                      : `https://image.tmdb.org/t/p/w500${fav.poster}`
                    : "https://via.placeholder.com/300x450?text=No+Image"
                }
                alt={fav.title}
                className="favourite-poster"
                style={{
                  width: "100%",
                  height: "330px",
                  objectFit: "cover",
                  borderBottom: "2px solid #000",
                }}
              />
              <div className="favourite-info" style={{ padding: "15px", textAlign: "center" }}>
                <h3 style={{ fontSize: "1rem", margin: "10px 0", color: "#fff" }}>{fav.title}</h3>
                {fav.rating && (
                  <p style={{ color: "#ffcc00", fontSize: "0.95rem" }}>⭐ {fav.rating}</p>
                )}
                <button
                  onClick={() => handleRemove(fav.movieId)}
                  className="remove-btn"
                  style={{
                    marginTop: "10px",
                    backgroundColor: "#e50914",
                    border: "none",
                    color: "#fff",
                    padding: "8px 14px",
                    borderRadius: "5px",
                    cursor: "pointer",
                    width: "100%",
                    transition: "background 0.2s ease",
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Favourite;
