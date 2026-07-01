import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

function Auth() {
  const [isSignup, setIsSignup] = useState(true);
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [emailAvailable, setEmailAvailable] = useState(null); // null: not checked, true: available, false: taken
  const [checkingEmail, setCheckingEmail] = useState(false);

  const navigate = useNavigate();
  const API_BASE = `${(import.meta.env.VITE_API_URL || "https://cinezone-project-main.onrender.com").replace(/\/$/, "")}/api/users`;


  // ✅ Check Email Availability
  const checkEmailAvailability = async (email) => {
    if (!email) return;
    setCheckingEmail(true);
    try {
      const res = await fetch(`${API_BASE}/check-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setEmailAvailable(data.available);
    } catch (err) {
      console.error(err);
      setEmailAvailable(null);
    } finally {
      setCheckingEmail(false);
    }
  };

  // ✅ Handle Signup Email Change
  const handleSignupEmailChange = (e) => {
    const email = e.target.value;
    setSignupEmail(email);
    if (email) {
      checkEmailAvailability(email);
    } else {
      setEmailAvailable(null);
    }
  };


  // ✅ SIGNUP
  const handleSignup = async (e) => {
    e.preventDefault();
    if (emailAvailable === false) {
      alert("Email already exists. Please use a different email or login.");
      return;
    }
    if (emailAvailable !== true) {
      alert("Please check email availability first.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signupEmail,
          password: signupPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Signup successful! Please login.");
        setIsSignup(false);
        setSignupEmail("");
        setSignupPassword("");
        setEmailAvailable(null);
      } else {
        alert(data.message || "Signup failed");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong!");
    }
  };

  // ✅ LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userEmail", loginEmail);
        localStorage.setItem("isAuthenticated", "true");
        alert("Login successful!");
        navigate("/home");
      } else {
        alert(data.message || "Invalid credentials");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong!");
    }
  };

  return (
    <div className="auth-page">
      <div className="heading">
        <div className="site-title">CineZone</div>
        <div className="site-caption">
          From Classics to Hidden Gems — We've got you.
        </div>
      </div>

      <div className="container">
        {isSignup ? (
          <form onSubmit={handleSignup}>
            <h2>Sign Up</h2>
            <input
              type="email"
              placeholder="Email"
              value={signupEmail}
              onChange={handleSignupEmailChange}
              required
            />
            {checkingEmail && <p style={{ color: "blue" }}>Checking email...</p>}
            {emailAvailable === true && <p style={{ color: "green" }}>Email is available</p>}
            {emailAvailable === false && <p style={{ color: "red" }}>Email already exists</p>}
            <input
              type="password"
              placeholder="Password"
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              required
            />
            <button type="submit" disabled={emailAvailable !== true}>Sign Up</button>
            <p className="toggle-link" onClick={() => {
              setIsSignup(false);
              setSignupEmail("");
              setSignupPassword("");
              setEmailAvailable(null);
            }}>
              Already have an account? Login
            </p>
          </form>
        ) : (
          <form onSubmit={handleLogin}>
            <h2>Login</h2>
            <input
              type="email"
              placeholder="Email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
            />
            <button type="submit">Login</button>
            <p className="toggle-link" onClick={() => {
              setIsSignup(true);
              setLoginEmail("");
              setLoginPassword("");
            }}>
              Don't have an account? Sign Up
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default Auth;
