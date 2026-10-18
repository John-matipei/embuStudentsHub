import React, { useState, useEffect, useCallback } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import ChangePassword from "./pages/ChangePassword";
import AdminDashboard from "./pages/AdminDashboard";
// import Team from "./pages/Team";
import Navbar from "./components/Navbar";
import AIChatAgent from "./components/AIChatAgent";

import Home from "./pages/home";
import Houses from "./pages/house";
import HouseDetails from "./pages/houseDetails";
import Booking from "./pages/Booking";
import LandlordLogin from "./pages/LandlordLogin";
import LandlordDashboard from "./pages/LandlordDashboard";
import LandlordBookings from "./pages/LandlordBookings";
import AddHouse from "./pages/AddHouse";
import NotFound from "./pages/NotFound";

import { getHouses, addHouse as apiAddHouse, updateHouse as apiUpdateHouse, deleteHouse as apiDeleteHouse } from "./services/api";

export default function App() {
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshHouses = useCallback(async () => {
    try {
      setError("");
      setLoading(true);

      const data = await getHouses();

      if (!Array.isArray(data)) {
        throw new Error("Invalid house data received from server.");
      }

      setHouses(data);
    } catch (err) {
      setError(err.message || "Could not load houses.");
      console.error("Loading houses failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshHouses();
  }, [refreshHouses]);

  const handleAddHouse = async (houseData) => {
    try {
      const result = await apiAddHouse(houseData);
      await refreshHouses();
      return result;
    } catch (err) {
      console.error("Failed to add house:", err);
      throw err;
    }
  };

  const handleUpdateHouse = async (id, changes) => {
    try {
      const result = await apiUpdateHouse(id, changes);
      await refreshHouses();
      return result;
    } catch (err) {
      console.error("Failed to update house:", err);
      throw err;
    }
  };

  const handleDeleteHouse = async (id) => {
    try {
      const result = await apiDeleteHouse(id);
      await refreshHouses();
      return result;
    } catch (err) {
      console.error("Failed to delete house:", err);
      throw err;
    }
  };

  return (
    <BrowserRouter>
      <div className="app">
        <Navbar />

        <main>
          {loading ? (
            <div className="container" style={{ padding: "100px 20px", textAlign: "center" }}>
              <div className="loading-spinner"></div>
              <p>Loading houses...</p>
              <style>{`
                .loading-spinner {
                  width: 50px;
                  height: 50px;
                  border: 4px solid #e0e7e1;
                  border-top-color: #176b3a;
                  border-radius: 50%;
                  animation: spin 1s linear infinite;
                  margin: 0 auto 20px;
                }
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : error ? (
            <div className="container" style={{ padding: "100px 20px", textAlign: "center" }}>
              <h2 style={{ color: "#b91c1c", marginBottom: "15px" }}>Connection Error</h2>
              <p style={{ color: "#68736c", marginBottom: "25px" }}>{error}</p>
              <div style={{ marginBottom: "20px" }}>
                <p style={{ fontSize: "14px", color: "#89938d" }}>
                  Please try again after a few minutes. :
                </p>
                <code style={{ 
                  display: "inline-block", 
                  padding: "10px 15px", 
                  background: "#f3f4f6", 
                  borderRadius: "8px",
                  marginTop: "10px",
                  fontSize: "13px"
                }}>
                  Thank you for your patience. We are working to resolve the issue.
                </code>
              </div>
              <button 
                onClick={refreshHouses}
                className="btn btn-primary"
              >
                Try Again
              </button>
            </div>
          ) : (
            <Routes>
              <Route path="/" element={<Home houses={houses} />} />
              <Route path="/houses" element={<Houses houses={houses} />} />
              <Route path="/houses/:id" element={<HouseDetails houses={houses} />} />
              <Route path="/booking/:id" element={<Booking houses={houses} />} />
              <Route path="/landlord/login" element={<LandlordLogin />} />
              <Route path="/landlord" element={<LandlordDashboard houses={houses} onRefresh={refreshHouses} onDelete={handleDeleteHouse} onUpdate={handleUpdateHouse} />} />
              <Route path="/landlord/bookings" element={<LandlordBookings houses={houses} />} />
              <Route path="/landlord/add" element={<AddHouse onSaved={refreshHouses} />} />
              <Route path="/landlord/change-password" element={<ChangePassword />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="*" element={<NotFound />} />
              {/* <Route path="/team" element={<Team />} /> */}
            </Routes>
          )}
        </main>

        {!loading && !error && <AIChatAgent />}

        <footer className="footer">
          <div className="container footer-inner">
            <div>
              <strong>Embu Student Homes</strong>
              <p>Find affordable student accommodation around University of Embu.</p>
            </div>
            <div>
              <span>© {new Date().getFullYear()} Embu Student Homes</span>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}