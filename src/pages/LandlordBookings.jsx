// LandlordBookings.jsx
import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, Calendar, Phone, Mail, User, MessageSquare,
  Home, Clock, CheckCircle2, XCircle, Loader2
} from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function LandlordBookings() {
  const [bookings, setBookings] = useState([]);
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const houseIdFilter = searchParams.get("houseId");
  
  // Check authentication and fetch data
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      navigate("/landlord/login");
      return;
    }

    // Fetch both houses and bookings
    fetchData(token);
  }, [navigate]);

  const fetchData = async (token) => {
    try {
      setLoading(true);
      setError("");

      // Fetch houses first (needed to filter bookings)
      const housesResponse = await axios.get(`${API_URL}/api/houses`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Fetch bookings
      const bookingsResponse = await axios.get(`${API_URL}/api/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setHouses(Array.isArray(housesResponse.data) ? housesResponse.data : []);
      setBookings(Array.isArray(bookingsResponse.data) ? bookingsResponse.data : []);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      if (err.response && err.response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/landlord/login");
      } else {
        setError("Failed to load your bookings. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : {};
  const landlordEmail = user.email || "";

  // SAFE: Filter houses belonging to this landlord
  const myHouses = Array.isArray(houses) ? houses.filter(h => 
    h.landlordEmail === landlordEmail || 
    h.landlord === "My Listing" ||
    h.landlord === "Demo Landlord" ||
    !h.landlordEmail
  ) : [];

  const myHouseIds = myHouses.map(h => h.id);

  // SAFE: Filter bookings for this landlord's houses
  const myBookings = Array.isArray(bookings) ? bookings.filter(b => 
    myHouseIds.includes(b.houseId)
  ) : [];

  // Filter by specific house if requested
  const filteredBookings = houseIdFilter 
    ? myBookings.filter(b => b.houseId === houseIdFilter)
    : myBookings;

  // Sort by date (newest first)
  const sortedBookings = [...filteredBookings].sort((a, b) => 
    new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );

  const updateStatus = async (bookingId, newStatus) => {
    setUpdatingId(bookingId);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_URL}/api/bookings/${bookingId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refresh data
      await fetchData(token);
    } catch (err) {
      setError("Failed to update status.");
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: "#fef3c7", color: "#92400e", text: "Pending" },
      confirmed: { bg: "#d1fae5", color: "#065f46", text: "Confirmed" },
      cancelled: { bg: "#fee2e2", color: "#991b1b", text: "Declined" },
      completed: { bg: "#dbeafe", color: "#1e40af", text: "Completed" }
    };
    const style = styles[status] || styles.pending;
    return (
      <span style={{
        padding: "6px 14px",
        background: style.bg,
        color: style.color,
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "700",
        textTransform: "uppercase"
      }}>
        {style.text}
      </span>
    );
  };

  if (loading) {
    return (
      <section className="section page-section">
        <div className="container">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
            <div className="loading-spinner" style={{
              width: "50px",
              height: "50px",
              border: "4px solid #e0e7e1",
              borderTopColor: "#176b3a",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              marginBottom: "20px"
            }}></div>
            <p>Loading your bookings...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section page-section">
      <div className="container">
        {/* Header */}
        <div className="page-heading">
          <div>
            <span className="eyebrow dark">MY BOOKINGS</span>
            <h1>Who Booked My Properties</h1>
            <p>Students who requested to view your houses</p>
          </div>
          <Link to="/landlord" className="btn btn-outline">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
        </div>

        {error && (
          <div className="form-error" style={{ marginBottom: "20px", padding: "15px", background: "#fef2f2", borderRadius: "8px", color: "#b91c1c" }}>
            {error}
          </div>
        )}

        {/* Summary Stats */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "15px",
          marginBottom: "30px"
        }}>
          {[
            { label: "Total", count: sortedBookings.length, color: "#176b3a" },
            { label: "Pending", count: sortedBookings.filter(b => b.status === "pending").length, color: "#f59e0b" },
            { label: "Confirmed", count: sortedBookings.filter(b => b.status === "confirmed").length, color: "#10b981" },
            { label: "Completed", count: sortedBookings.filter(b => b.status === "completed").length, color: "#3b82f6" },
          ].map(stat => (
            <div key={stat.label} style={{
              padding: "20px",
              background: "white",
              borderRadius: "12px",
              textAlign: "center",
              border: "1px solid #e5e7eb"
            }}>
              <strong style={{ fontSize: "32px", color: stat.color }}>{stat.count}</strong>
              <span style={{ color: "#68736c", fontSize: "14px" }}>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Bookings List */}
        {sortedBookings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <Calendar size={64} color="#d1d5db" />
            <h3 style={{ margin: "20px 0 10px" }}>No bookings yet</h3>
            <p style={{ color: "#68736c" }}>
              {houseIdFilter 
                ? "No one has booked this property yet."
                : "Students haven't requested viewings for any of your properties."}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {sortedBookings.map(booking => {
              const house = myHouses.find(h => h.id === booking.houseId);
              
              return (
                <div key={booking.id} style={{
                  background: "white",
                  borderRadius: "16px",
                  border: "1px solid #e5e7eb",
                  overflow: "hidden"
                }}>
                  {/* Student Info Header */}
                  <div style={{
                    padding: "20px 24px",
                    background: "#176b3a",
                    color: "white"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                      <User size={20} />
                      <h3 style={{ margin: 0, fontSize: "18px" }}>{booking.name}</h3>
                    </div>
                    <p style={{ margin: 0, opacity: 0.9, fontSize: "14px" }}>
                      Wants to view your property • {getStatusBadge(booking.status)}
                    </p>
                  </div>

                  <div style={{ padding: "24px" }}>
                    {/* Contact Info */}
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "20px",
                      marginBottom: "24px",
                      paddingBottom: "24px",
                      borderBottom: "1px solid #e5e7eb"
                    }}>
                      <div>
                        <span style={{ fontSize: "12px", color: "#89938d", textTransform: "uppercase" }}>
                          Phone Number
                        </span>
                        <p style={{ margin: "4px 0 0" }}>
                          <a href={`tel:${booking.phone}`} style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#176b3a",
                            textDecoration: "none"
                          }}>
                            {booking.phone}
                          </a>
                        </p>
                      </div>
                      
                      {booking.email && (
                        <div>
                          <span style={{ fontSize: "12px", color: "#89938d", textTransform: "uppercase" }}>
                            Email
                          </span>
                          <p style={{ margin: "4px 0 0" }}>
                            <a href={`mailto:${booking.email}`} style={{
                              fontSize: "14px",
                              color: "#2563eb",
                              textDecoration: "none"
                            }}>
                              {booking.email}
                            </a>
                          </p>
                        </div>
                      )}
                      
                      {booking.studentId && (
                        <div>
                          <span style={{ fontSize: "12px", color: "#89938d", textTransform: "uppercase" }}>
                            Student ID
                          </span>
                          <p style={{ margin: "4px 0 0", fontFamily: "monospace", fontSize: "14px" }}>
                            {booking.studentId}
                          </p>
                        </div>
                      )}
                      
                      <div>
                        <span style={{ fontSize: "12px", color: "#89938d", textTransform: "uppercase" }}>
                          Requested Date
                        </span>
                        <p style={{ margin: "4px 0 0", fontSize: "14px", fontWeight: "600" }}>
                          {booking.preferredDate ? new Date(booking.preferredDate).toLocaleDateString("en-KE", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric"
                          }) : "Not specified"}
                        </p>
                      </div>
                    </div>

                    {/* Property Info */}
                    {house && (
                      <div style={{
                        display: "flex",
                        gap: "15px",
                        alignItems: "center",
                        marginBottom: "20px",
                        padding: "15px",
                        background: "#f8faf9",
                        borderRadius: "12px"
                      }}>
                        <img 
                          src={house.image || '/placeholder-house.jpg'} 
                          alt={house.title}
                          style={{ width: "80px", height: "60px", objectFit: "cover", borderRadius: "8px" }}
                        />
                        <div>
                          <span style={{ fontSize: "12px", color: "#176b3a", fontWeight: "700" }}>
                            PROPERTY THEY WANT TO VIEW
                          </span>
                          <h4 style={{ margin: "4px 0 2px", fontSize: "16px" }}>{house.title}</h4>
                          <p style={{ margin: 0, color: "#68736c", fontSize: "13px" }}>
                            {house.estate} • KSh {Number(house.rent || 0).toLocaleString()}/month
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Message */}
                    {booking.message && (
                      <div style={{
                        padding: "16px 20px",
                        background: "#f8faf9",
                        borderRadius: "10px",
                        borderLeft: "3px solid #176b3a",
                        marginBottom: "20px"
                      }}>
                        <span style={{ fontSize: "12px", color: "#89938d" }}>
                          <MessageSquare size={12} style={{ marginRight: "6px" }} />
                          MESSAGE FROM STUDENT:
                        </span>
                        <p style={{ margin: "8px 0 0", fontStyle: "italic", color: "#374151" }}>
                          "{booking.message}"
                        </p>
                      </div>
                    )}

                    {/* Requested Time */}
                    {booking.preferredTime && (
                      <div style={{ marginBottom: "20px" }}>
                        <span style={{ fontSize: "12px", color: "#89938d" }}>
                          <Clock size={12} style={{ marginRight: "6px" }} />
                          Preferred time: {booking.preferredTime}
                        </span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {booking.status === "pending" && (
                      <div style={{ display: "flex", gap: "12px" }}>
                        <button
                          onClick={() => updateStatus(booking.id, "confirmed")}
                          disabled={updatingId === booking.id}
                          style={{
                            flex: 1,
                            padding: "12px 24px",
                            background: "#176b3a",
                            color: "white",
                            border: "none",
                            borderRadius: "10px",
                            fontSize: "14px",
                            fontWeight: "700",
                            cursor: "pointer",
                            opacity: updatingId === booking.id ? 0.7 : 1
                          }}
                        >
                          {updatingId === booking.id ? "Updating..." : "Confirm Booking"}
                        </button>
                        <button
                          onClick={() => updateStatus(booking.id, "cancelled")}
                          disabled={updatingId === booking.id}
                          style={{
                            flex: 1,
                            padding: "12px 24px",
                            background: "#fee2e2",
                            color: "#991b1b",
                            border: "none",
                            borderRadius: "10px",
                            fontSize: "14px",
                            fontWeight: "700",
                            cursor: "pointer",
                            opacity: updatingId === booking.id ? 0.7 : 1
                          }}
                        >
                          Decline
                        </button>
                      </div>
                    )}

                    {/* Booking Date */}
                    <p style={{ 
                      margin: "20px 0 0", 
                      fontSize: "12px", 
                      color: "#89938d",
                      textAlign: "right"
                    }}>
                      Requested on {booking.createdAt ? new Date(booking.createdAt).toLocaleString() : "Unknown date"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}