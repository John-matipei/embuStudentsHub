// src/pages/AdminLogin.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Shield, Lock, Mail, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AdminLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    console.log("Attempting admin login with:", form.email);

    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, form);
      console.log("Login response:", response.data);

      const { token, landlord } = response.data;

      // CRITICAL: Check if user is admin
      if (!landlord.role || landlord.role !== 'admin') {
        console.log("User role:", landlord.role);
        setError("Access denied. Admin privileges required.");
        setLoading(false);
        return;
      }

      // Save auth data
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(landlord));
      console.log("Auth saved, redirecting to /admin/dashboard");

      // Redirect to admin dashboard
      navigate("/admin/dashboard");
      
    } catch (err) {
      console.error("Admin login error:", err);
      const message = err.response?.data?.message || "Invalid email or password";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        <div className="admin-login-left">
          <div className="admin-brand">
            <Shield size={48} color="#ffffff" />
            <h1>Admin Portal</h1>
            <p>Embu Student Homes</p>
          </div>
          <div className="admin-features">
            <div className="feature">
              <span>✓</span> Manage all landlords
            </div>
            <div className="feature">
              <span>✓</span> View security logs
            </div>
            <div className="feature">
              <span>✓</span> Monitor all bookings
            </div>
            <div className="feature">
              <span>✓</span> System analytics
            </div>
          </div>
        </div>

        <div className="admin-login-right">
          <Link to="/" className="back-link">
            <ArrowLeft size={16} />
            Back to website
          </Link>

          <div className="login-form-container">
            <div className="login-header">
              <Shield size={32} color="#176b3a" />
              <h2>Administrator Sign In</h2>
              <p>Enter your credentials to access the admin dashboard</p>
            </div>

            {error && (
              <div className="error-message">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>
                  <Mail size={16} />
                  Admin Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="admin@embu.com"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>
                  <Lock size={16} />
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className="btn-admin-login"
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 size={18} className="spin" /> Authenticating...</>
                ) : (
                  "Sign In to Admin"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        .admin-login-page {
          min-height: 100vh;
          display: flex;
          background: #f8faf9;
        }

        .admin-login-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          min-height: 100vh;
        }

        .admin-login-left {
          background: linear-gradient(135deg, #176b3a 0%, #0d5a30 100%);
          color: white;
          padding: 60px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .admin-brand {
          margin-bottom: 60px;
        }

        .admin-brand h1 {
          font-size: 42px;
          font-weight: 800;
          margin: 20px 0 10px;
        }

        .admin-brand p {
          font-size: 18px;
          opacity: 0.9;
        }

        .admin-features {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .feature {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 16px;
          opacity: 0.95;
        }

        .feature span {
          width: 24px;
          height: 24px;
          background: rgba(255,255,255,0.2);
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-size: 12px;
        }

        .admin-login-right {
          padding: 40px 60px;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .back-link {
          position: absolute;
          top: 40px;
          left: 60px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #68736c;
          font-size: 14px;
          text-decoration: none;
          transition: color 0.2s;
        }

        .back-link:hover {
          color: #176b3a;
        }

        .login-form-container {
          max-width: 400px;
          margin: auto;
          width: 100%;
        }

        .login-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .login-header h2 {
          font-size: 28px;
          font-weight: 700;
          color: #111827;
          margin: 16px 0 8px;
        }

        .login-header p {
          color: #68736c;
          font-size: 15px;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          padding: 12px 16px;
          border-radius: 10px;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          color: #374151;
          margin-bottom: 8px;
        }

        .form-group label svg {
          color: #176b3a;
        }

        .form-group input {
          width: 100%;
          padding: 14px 16px;
          border: 1px solid #d1d5db;
          border-radius: 12px;
          font-size: 15px;
          outline: none;
          transition: all 0.2s;
        }

        .form-group input:focus {
          border-color: #176b3a;
          box-shadow: 0 0 0 3px rgba(23, 107, 58, 0.1);
        }

        .form-group input:disabled {
          background: #f3f4f6;
          cursor: not-allowed;
        }

        .btn-admin-login {
          width: 100%;
          padding: 16px;
          background: #176b3a;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-admin-login:hover:not(:disabled) {
          background: #0d5a30;
        }

        .btn-admin-login:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .login-footer {
          margin-top: 30px;
          padding-top: 30px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
        }

        .login-footer p {
          color: #68736c;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .login-footer code {
          background: #f3f4f6;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          color: #374151;
        }

        /* Responsive */
        @media (max-width: 900px) {
          .admin-login-container {
            grid-template-columns: 1fr;
          }

          .admin-login-left {
            display: none;
          }

          .admin-login-right {
            padding: 40px 24px;
          }

          .back-link {
            left: 24px;
            top: 24px;
          }
        }
      `}</style>
    </div>
  );
}