// LandlordLogin.jsx
import React, { useState } from "react";
import {
  Building2,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import {
  Link,
  useNavigate,
} from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function LandlordLogin() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Call the backend API directly with axios
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email: email.trim(),
        password: password
      });
      
      const result = response.data;
      
      // CRITICAL FIX: Store using the NEW keys that LandlordDashboard expects
      localStorage.setItem("token", result.token);
      localStorage.setItem("user", JSON.stringify(result.landlord));
      
      // Clear any old keys to prevent confusion
      localStorage.removeItem("esh_token");
      localStorage.removeItem("esh_landlord_email");
      localStorage.removeItem("esh_landlord_session");
      
      // ROLE CHECK: Use role from API response, fallback to email check
      const userRole = result.landlord.role || "landlord";
      const userEmail = result.landlord.email.toLowerCase();
      
      // Check if admin (either by role or by specific admin emails)
      const isAdmin = 
        userRole === "admin" ||
        userEmail === "landlord@embu.com" || 
        userEmail === "admin@embu.com" || 
        userEmail === "admin@gmail.com" ||
        userEmail === "database@embu.com";
      
      if (isAdmin) {
        // If user is admin but role wasn't set, update it in storage for future checks
        if (userRole !== "admin") {
          const updatedUser = { ...result.landlord, role: "admin" };
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
        navigate("/admin");
      } else {
        navigate("/landlord");
      }
      
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.message || 
        err.message || 
        "Invalid email or password."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <Building2 size={25} />
        </div>

        <span className="eyebrow dark">
          LANDLORD PORTAL
        </span>

        <h1>
          Manage your properties
        </h1>

        <p className="muted">
          Sign in with the credentials provided by the administrator.
        </p>

        <form onSubmit={submit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={isLoading}
            />
          </label>

          <label>
            Password
            <div className="password-field">
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                disabled={isLoading}
              >
                {show ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </label>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <button
            className="btn btn-primary btn-large full"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="spin" />
                Signing in...
              </>
            ) : (
              <>
                <LockKeyhole size={18} />
                Secure sign in
              </>
            )}
          </button>
        </form>

        <div className="security-line">
          <ShieldCheck size={17} />
          Secure authentication system
        </div>

        <Link to="/" className="back-link centered-link">
          ← Back to website
        </Link>
      </div>

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>
    </section>
  );
}