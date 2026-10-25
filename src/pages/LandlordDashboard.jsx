// src/pages/LandlordDashboard.jsx
import React, { useState, useEffect } from "react";
import {
  Building2,
  CheckCircle2,
  Plus,
  Trash2,
  XCircle,
  Loader2,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function LandlordDashboard() {
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [authError, setAuthError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      navigate("/landlord/login");
      return;
    }

    fetchHouses(token);
  }, [navigate]);

  const fetchHouses = async (token) => {
    try {
      setLoading(true);
      setError("");
      setAuthError(false);

      const response = await axios.get(`${API_URL}/api/my-houses`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setHouses(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to fetch houses:", err);

      if (err.response) {
        const status = err.response.status;
        if (status === 401) {
          setAuthError(true);
          setError("Your session has expired. Please login again.");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setTimeout(() => navigate("/landlord/login"), 3000);
        } else if (status === 403) {
          setAuthError(true);
          setError("Access denied. You do not have permission to view this page.");
        } else {
          setError(`Server error (${status}). Please try again later.`);
        }
      } else if (err.request) {
        setError("Cannot connect to the server. Ensure the backend is running on port 5000.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const userStr = localStorage.getItem("user");
  const email = userStr ? JSON.parse(userStr).email : "";

  const toggleAvailability = async (house) => {
    setUpdatingId(house.id);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const newStatus = house.status === "Vacant" || house.status === "available" ? "Occupied" : "Vacant";
      
      await axios.put(
        `${API_URL}/api/houses/${house.id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (token) fetchHouses(token);
    } catch (err) {
      console.error("Update error:", err);
      if (err.response && err.response.status === 401) {
        setError("Session expired. Redirecting to login.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setTimeout(() => navigate("/landlord/login"), 2000);
      } else {
        setError(err.response?.data?.message || "Failed to update status.");
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const removeHouse = async (house) => {
    if (!window.confirm(`Delete "${house.title}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(house.id);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      await axios.delete(`${API_URL}/api/houses/${house.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (token) fetchHouses(token);
    } catch (err) {
      console.error("Delete error:", err);
      if (err.response && err.response.status === 401) {
        setError("Session expired. Redirecting to login.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setTimeout(() => navigate("/landlord/login"), 2000);
      } else {
        setError(err.response?.data?.message || "Failed to delete property.");
      }
    } finally {
      setDeletingId(null);
    }
  };

  const viewHouseBookings = (houseId) => {
    navigate(`/landlord/bookings?houseId=${houseId}`);
  };

  const viewAllBookings = () => {
    navigate("/landlord/bookings");
  };

  const vacantCount = houses.filter((h) => h.status === "Vacant" || h.status === "available").length;
  const occupiedCount = houses.filter((h) => h.status === "Occupied" || h.status === "occupied").length;

  if (loading) {
    return (
      <div className="container loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
        <style>{`
          .loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; }
          .loading-spinner { width: 50px; height: 50px; border: 4px solid #e0e7e1; border-top-color: #176b3a; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (authError) {
    return (
      <section className="section page-section">
        <div className="container narrow" style={{ textAlign: "center", paddingTop: "80px" }}>
          <div style={{ width: "80px", height: "80px", margin: "0 auto 25px", background: "#fef2f2", borderRadius: "50%", display: "grid", placeItems: "center" }}>
            <XCircle size={40} color="#dc2626" />
          </div>
          <h1 style={{ marginBottom: "15px", color: "#111827" }}>Access Denied</h1>
          <p style={{ color: "#68736c", marginBottom: "30px" }}>{error}</p>
          <p style={{ color: "#9ca3af", fontSize: "14px" }}>Redirecting to login page...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="section page-section">
      <div className="container">
        <div className="dashboard-head">
          <div>
            <span className="eyebrow dark">LANDLORD DASHBOARD</span>
            <h1>Welcome back</h1>
            <p>{email || "Landlord"}</p>
          </div>

          <div className="dashboard-head-actions">
            <button onClick={viewAllBookings} className="btn btn-outline">
              <Calendar size={18} />
              View Bookings
            </button>
            <Link to="/landlord/add" className="btn btn-primary">
              <Plus size={18} />
              Add property
            </Link>
          </div>
        </div>

        {error && !authError && (
          <div className="dashboard-error">
            <span>⚠️</span>
            <span>{error}</span>
            <button onClick={() => setError("")}>×</button>
          </div>
        )}

        <div className="dashboard-stats">
          <div>
            <Building2 />
            <strong>{houses.length}</strong>
            <span>Total listings</span>
          </div>
          <div>
            <CheckCircle2 />
            <strong>{vacantCount}</strong>
            <span>Vacant</span>
          </div>
          <div>
            <XCircle />
            <strong>{occupiedCount}</strong>
            <span>Occupied</span>
          </div>
        </div>

        <div className="dashboard-table-wrap">
          <div className="table-heading">
            <h2>Your properties</h2>
            <span>Update availability whenever a room is taken.</span>
          </div>

          {houses.map((house) => (
            <div className="property-row" key={house.id}>
              <img src={house.image || '/placeholder-house.jpg'} alt={house.title} />

              <div className="property-main">
                <strong>{house.title}</strong>
                <span>
                  {house.estate} · KSh {Number(house.rent).toLocaleString()} / month
                </span>
              </div>

              <span
                className={
                  house.status === "Vacant" || house.status === "available" 
                    ? "status vacant" 
                    : "status occupied"
                }
              >
                {house.status}
              </span>

              <div className="row-actions">
                <button
                  title="View bookings"
                  className="bookings-btn"
                  onClick={() => viewHouseBookings(house.id)}
                >
                  <Calendar size={17} />
                </button>

                <button
                  title="Toggle availability"
                  onClick={() => toggleAvailability(house)}
                  disabled={updatingId === house.id || deletingId === house.id}
                  className={updatingId === house.id ? "loading" : ""}
                >
                  {updatingId === house.id ? (
                    <Loader2 size={17} className="spin" />
                  ) : house.status === "Vacant" || house.status === "available" ? (
                    <XCircle />
                  ) : (
                    <CheckCircle2 />
                  )}
                </button>

                <button
                  title="Delete"
                  className="danger"
                  onClick={() => removeHouse(house)}
                  disabled={updatingId === house.id || deletingId === house.id}
                >
                  {deletingId === house.id ? (
                    <Loader2 size={17} className="spin" />
                  ) : (
                    <Trash2 />
                  )}
                </button>
              </div>
            </div>
          ))}

          {!houses.length && (
            <div className="empty">
              <p>You have no listings yet.</p>
              <Link to="/landlord/add" className="btn btn-primary">
                Add your first property
              </Link>
            </div>
          )}
        </div>

        <div className="bookings-section">
          <div className="bookings-card">
            <div>
              <h3>Manage Bookings</h3>
              <p>View and manage all student viewing requests for your properties.</p>
            </div>
            <button onClick={viewAllBookings} className="btn btn-primary">
              View All Bookings
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .dashboard-head-actions { display: flex; gap: 12px; }
        .dashboard-error { display: flex; align-items: center; gap: 12px; padding: 14px 18px; margin-bottom: 20px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; color: #b91c1c; font-size: 14px; }
        .dashboard-error button { margin-left: auto; width: 28px; height: 28px; display: grid; place-items: center; background: transparent; border: none; border-radius: 6px; color: #b91c1c; font-size: 18px; cursor: pointer; }
        .dashboard-error button:hover { background: #fee2e2; }
        .row-actions { display: flex; align-items: center; gap: 8px; }
        .row-actions button { width: 38px; height: 38px; display: grid; place-items: center; background: white; border: 1px solid #dce4de; border-radius: 10px; color: #176b3a; cursor: pointer; transition: all 0.2s; }
        .row-actions button:hover:not(:disabled) { background: #e9f6ed; }
        .row-actions button:disabled { opacity: 0.5; cursor: not-allowed; }
        .row-actions .danger { color: #dc2626; border-color: #fecaca; }
        .row-actions .danger:hover:not(:disabled) { background: #fef2f2; }
        .row-actions .bookings-btn { color: #2563eb; border-color: #dbeafe; }
        .row-actions .bookings-btn:hover { background: #eff6ff; border-color: #3b82f6; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .property-row img { width: 75px; height: 58px; object-fit: cover; border-radius: 10px; background: #e5e7eb; }
        .bookings-section { margin-top: 30px; }
        .bookings-card { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 24px; background: linear-gradient(135deg, #e9f6ed 0%, #d1fae5 100%); border: 1px solid #a7f3d0; border-radius: 16px; }
        .bookings-card h3 { margin: 0 0 8px; color: #065f46; font-size: 20px; }
        .bookings-card p { margin: 0; color: #047857; font-size: 14px; }
        @media (max-width: 640px) {
          .dashboard-head { flex-direction: column; align-items: flex-start; }
          .dashboard-head-actions { width: 100%; }
          .dashboard-head-actions .btn { flex: 1; }
          .bookings-card { flex-direction: column; text-align: center; }
          .bookings-card .btn { width: 100%; }
        }
      `}</style>
    </section>
  );
}