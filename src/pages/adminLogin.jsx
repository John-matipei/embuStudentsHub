import React, { useState } from "react";
import { Shield, LockKeyhole, Eye, EyeOff, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { loginLandlord } from "../services/api";

export default function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
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
      const result = await loginLandlord(email.trim(), password);
      
      // Check if admin
      if (result.landlord.email !== "landlord@embu.com" && 
          result.landlord.email !== "admin@embu.com") {
        setError("Access denied. Admin only.");
        localStorage.clear();
        setIsLoading(false);
        return;
      }
      
      // Store auth data
      localStorage.setItem("esh_token", result.token);
      localStorage.setItem("esh_landlord_email", result.landlord.email);
      localStorage.setItem("esh_landlord_session", "active");
      
      // Redirect to admin dashboard
      navigate("/admin");
      
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-card">
        <div className="auth-logo" style={{ background: "#dc2626" }}>
          <Shield size={25} color="white" />
        </div>

        <span className="eyebrow dark">ADMIN PORTAL</span>

        <h1>Admin Access</h1>

        <p className="muted">
          Secure login for system administrators only.
        </p>

        <form onSubmit={submit}>
          <label>
            Admin Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@embu.com"
              required
              disabled={isLoading}
            />
          </label>

          <label>
            Password
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </label>

          {error && (
            <div className="form-error" style={{ 
              background: "#fee2e2", 
              color: "#991b1b",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "15px"
            }}>
              {error}
            </div>
          )}

          <button
            className="btn btn-primary btn-large full"
            type="submit"
            disabled={isLoading}
            style={{ background: "#dc2626" }}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="spin" />
                Verifying...
              </>
            ) : (
              <>
                <LockKeyhole size={18} />
                Secure Login
              </>
            )}
          </button>
        </form>

        <div className="demo-box" style={{ borderColor: "#dc2626" }}>
          <strong>Default Admin</strong>
          <span>landlord@embu.com</span>
          <span>Embu123!</span>
        </div>

        <div className="security-line">
          <Shield size={17} color="#dc2626" />
          Restricted access - Admin only
        </div>
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
        .auth-logo {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }
      `}</style>
    </section>
  );
}