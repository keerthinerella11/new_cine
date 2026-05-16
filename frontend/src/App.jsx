import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth.jsx";
import Home from "./pages/Home.jsx";
import Movies from "./pages/Movies.jsx";
import MovieDetails from "./pages/MovieDetails.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Favourite from "./pages/Favourite.jsx"; // ✅ New import

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth page */}
        <Route path="/" element={<Auth />} />

        {/* Home page (protected) */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        {/* Movies page (protected) */}
        <Route
          path="/movies"
          element={
            <ProtectedRoute>
              <Movies />
            </ProtectedRoute>
          }
        />

        {/* Movie Details page (protected) */}
        <Route
          path="/movie/:id"
          element={
            <ProtectedRoute>
              <MovieDetails />
            </ProtectedRoute>
          }
        />

        {/* Favourites page (protected) */}
        <Route
          path="/favourites"
          element={
            <ProtectedRoute>
              <Favourite />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
