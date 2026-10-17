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
import { loginLandlord } from "../services/api";

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
      // Attempt login
      const result = await loginLandlord(email.trim(), password);
      
      // Store session data
      localStorage.setItem("esh_token", result.token);
      localStorage.setItem("esh_landlord_email", result.landlord.email);
      localStorage.setItem("esh_landlord_session", "active");
      
      // --- ROLE CHECK LOGIC ---
      const userEmail = result.landlord.email.toLowerCase();
      
      // Check if the user is an admin
      if (userEmail === "landlord@embu.com" || userEmail === "admin@embu.com") {
        // Redirect Admin to Admin Dashboard
        navigate("/admin");
      } else {
        // Redirect Regular Landlord to Landlord Dashboard
        navigate("/landlord");
      }
      // ------------------------
      
    } catch (err) {
      setError(err.message || "Invalid email or password.");
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
            )
          }
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