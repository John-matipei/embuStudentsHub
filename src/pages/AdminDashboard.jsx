import React, { useState, useEffect } from "react";
import { 
  Users, Home, Calendar, CheckCircle, XCircle, 
  Clock, AlertCircle, RefreshCw, Search, Shield,
  LogOut, ArrowLeft
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getAllLandlords, getHouses, getBookings, checkAuthStatus } from "../services/api";

export default function AdminDashboard() {
  const [landlords, setLandlords] = useState([]);
  const [houses, setHouses] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isAdmin, setIsAdmin] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      // Check if logged in
      const token = localStorage.getItem("esh_token");
      if (!token) {
        navigate("/admin/login");
        return;
      }

      // Verify admin status
      const auth = await checkAuthStatus();
      const email = auth.landlord?.email;
      
      if (email !== "landlord@embu.com" && email !== "admin@embu.com") {
        setError("Access denied. Admin privileges required.");
        setLoading(false);
        return;
      }
      
      setIsAdmin(true);
      await loadData();
    } catch (err) {
      // Token invalid or expired
      localStorage.clear();
      navigate("/admin/login");
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      // Load all data in parallel
      const [landlordsData, housesData, bookingsData] = await Promise.all([
        getAllLandlords(),
        getHouses(),
        getBookings().catch(() => [])
      ]);

      setLandlords(landlordsData);
      setHouses(housesData);
      setBookings(bookingsData);
    } catch (err) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/admin/login");
  };

  // Get houses for specific landlord
  const getLandlordHouses = (landlordId) => {
    return houses.filter(h => h.landlord_id === landlordId || h.landlordId === landlordId);
  };

  // Get bookings for specific house
  const getHouseBookings = (houseId) => {
    return bookings.filter(b => b.house_id === houseId || b.houseId === houseId);
  };

  // Get status counts
  const getStatusCounts = (houseId) => {
    const houseBookings = getHouseBookings(houseId);
    return {
      pending: houseBookings.filter(b => b.status === 'pending').length,
      confirmed: houseBookings.filter(b => b.status === 'confirmed').length,
      cancelled: houseBookings.filter(b => b.status === 'cancelled').length,
      completed: houseBookings.filter(b => b.status === 'completed').length,
      total: houseBookings.length
    };
  };

  // Filter landlords
  const filteredLandlords = landlords.filter(l => 
    l.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading-container">
        <RefreshCw className="spin" size={32} />
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <AlertCircle size={48} color="#dc2626" />
        <h2>Access Denied</h2>
        <p>{error}</p>
        <button onClick={handleLogout} className="btn btn-primary">
          <LogOut size={16} />
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-header">
        <div className="header-content">
          <h1>
            <Shield size={28} color="#dc2626" />
            Admin Dashboard
          </h1>
          <p>System Overview - Landlords, Houses & Bookings</p>
        </div>
        <div className="header-actions">
          <button onClick={loadData} className="btn btn-outline">
            <RefreshCw size={16} />
            Refresh
          </button>
          <Link to="/" className="btn btn-outline">
            <ArrowLeft size={16} />
            Website
          </Link>
          <button onClick={handleLogout} className="btn btn-danger">
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      {/* Stats Overview */}
      <section className="stats-grid">
        <div className="stat-card">
          <Users size={24} color="#3b82f6" />
          <div>
            <h3>{landlords.length}</h3>
            <p>Total Landlords</p>
          </div>
        </div>
        <div className="stat-card">
          <Home size={24} color="#10b981" />
          <div>
            <h3>{houses.length}</h3>
            <p>Total Houses</p>
          </div>
        </div>
        <div className="stat-card">
          <Calendar size={24} color="#f59e0b" />
          <div>
            <h3>{bookings.length}</h3>
            <p>Total Bookings</p>
          </div>
        </div>
        <div className="stat-card">
          <Clock size={24} color="#8b5cf6" />
          <div>
            <h3>{bookings.filter(b => b.status === 'pending').length}</h3>
            <p>Pending Bookings</p>
          </div>
        </div>
      </section>

      {/* Search & Filter */}
      <section className="search-filter">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search landlords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </section>

      {/* Landlords Table */}
      <section className="landlords-section">
        <h2>All Landlords</h2>
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Landlord</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Houses Posted</th>
                <th>Total Bookings</th>
                <th>Account Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLandlords.map(landlord => {
                const landlordHouses = getLandlordHouses(landlord.id);
                const totalBookings = landlordHouses.reduce((sum, h) => 
                  sum + getStatusCounts(h.id).total, 0
                );
                
                return (
                  <tr key={landlord.id}>
                    <td>
                      <div className="landlord-info">
                        <strong>{landlord.name || 'N/A'}</strong>
                        {landlord.is_default_account && (
                          <span className="badge default">Default</span>
                        )}
                      </div>
                    </td>
                    <td>{landlord.email}</td>
                    <td>{landlord.phone || '-'}</td>
                    <td>
                      <span className="badge houses">{landlordHouses.length}</span>
                    </td>
                    <td>
                      <span className="badge bookings">{totalBookings}</span>
                    </td>
                    <td>
                      <span className={`badge ${landlord.password_changed ? 'active' : 'pending'}`}>
                        {landlord.password_changed ? 'Active' : 'Pending Setup'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Houses & Bookings Detail */}
      <section className="houses-section">
        <h2>Houses & Booking Status</h2>
        <div className="houses-grid">
          {houses.map(house => {
            const counts = getStatusCounts(house.id);
            const landlord = landlords.find(l => l.id === house.landlord_id || l.id === house.landlordId);
            
            return (
              <div key={house.id} className="house-card">
                <div className="house-header">
                  <img 
                    src={house.image || '/placeholder-house.jpg'} 
                    alt={house.title}
                    className="house-image"
                    onError={(e) => e.target.src = '/placeholder-house.jpg'}
                  />
                  <div className="house-title">
                    <h4>{house.title}</h4>
                    <p>{house.estate}</p>
                    <span className="landlord-name">
                      by {landlord?.name || 'Unknown'}
                    </span>
                  </div>
                </div>
                
                <div className="house-details">
                  <div className="detail-row">
                    <span>Price:</span>
                    <strong>KSh {house.rent?.toLocaleString()}/month</strong>
                  </div>
                  <div className="detail-row">
                    <span>Status:</span>
                    <span className={`badge ${house.status?.toLowerCase()}`}>
                      {house.status}
                    </span>
                  </div>
                </div>

                <div className="booking-status">
                  <h5>Bookings</h5>
                  <div className="status-bars">
                    {counts.total > 0 ? (
                      <>
                        <div className="status-item">
                          <Clock size={14} color="#f59e0b" />
                          <span>Pending: {counts.pending}</span>
                        </div>
                        <div className="status-item">
                          <CheckCircle size={14} color="#10b981" />
                          <span>Confirmed: {counts.confirmed}</span>
                        </div>
                        <div className="status-item">
                          <XCircle size={14} color="#ef4444" />
                          <span>Cancelled: {counts.cancelled}</span>
                        </div>
                        <div className="status-item">
                          <CheckCircle size={14} color="#3b82f6" />
                          <span>Completed: {counts.completed}</span>
                        </div>
                      </>
                    ) : (
                      <p className="no-bookings">No bookings yet</p>
                    )}
                  </div>
                  <div className="total-bookings">
                    Total: {counts.total} bookings
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Bookings */}
      <section className="bookings-section">
        <h2>Recent Bookings</h2>
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>House</th>
                <th>Landlord</th>
                <th>Preferred Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.slice(0, 50).map(booking => {
                const house = houses.find(h => h.id === booking.house_id || h.id === booking.houseId);
                const landlord = landlords.find(l => l.id === house?.landlord_id || l.id === house?.landlordId);
                
                return (
                  <tr key={booking.id}>
                    <td>
                      <div>
                        <strong>{booking.name}</strong>
                        <p className="small">{booking.email}</p>
                        <p className="small">{booking.phone}</p>
                      </div>
                    </td>
                    <td>{house?.title || 'Unknown'}</td>
                    <td>{landlord?.name || 'Unknown'}</td>
                    <td>
                      {booking.preferredDate ? new Date(booking.preferredDate).toLocaleDateString('en-KE', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : '-'}
                    </td>
                    <td>
                      <span className={`badge ${booking.status}`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Styles */}
      <style>{`
        .admin-dashboard {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
          background: #f3f4f6;
          min-height: 100vh;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .header-content h1 {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0;
          color: #1f2937;
          font-size: 24px;
        }

        .header-content p {
          color: #6b7280;
          margin: 5px 0 0;
          font-size: 14px;
        }

        .header-actions {
          display: flex;
          gap: 10px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .stat-card h3 {
          font-size: 32px;
          margin: 0;
          color: #1f2937;
        }

        .stat-card p {
          color: #6b7280;
          margin: 0;
          font-size: 14px;
        }

        .search-filter {
          display: flex;
          gap: 15px;
          margin-bottom: 25px;
        }

        .search-box, .filter-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: white;
          padding: 10px 15px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .search-box input {
          border: none;
          outline: none;
          width: 250px;
          font-size: 14px;
        }

        .filter-box select {
          border: none;
          outline: none;
          background: transparent;
          font-size: 14px;
        }

        .landlords-section, .houses-section, .bookings-section {
          margin-bottom: 40px;
        }

        .landlords-section h2, .houses-section h2, .bookings-section h2 {
          margin-bottom: 20px;
          color: #1f2937;
          font-size: 20px;
        }

        .table-container {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
        }

        .admin-table th {
          background: #f9fafb;
          padding: 15px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
          font-size: 13px;
          text-transform: uppercase;
        }

        .admin-table td {
          padding: 15px;
          border-bottom: 1px solid #e5e7eb;
          font-size: 14px;
        }

        .admin-table tr:hover {
          background: #f9fafb;
        }

        .badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }

        .badge.default {
          background: #dbeafe;
          color: #1e40af;
        }

        .badge.houses {
          background: #d1fae5;
          color: #065f46;
        }

        .badge.bookings {
          background: #fef3c7;
          color: #92400e;
        }

        .badge.active {
          background: #d1fae5;
          color: #065f46;
        }

        .badge.pending {
          background: #fef3c7;
          color: #92400e;
        }

        .badge.confirmed {
          background: #d1fae5;
          color: #065f46;
        }

        .badge.cancelled {
          background: #fee2e2;
          color: #991b1b;
        }

        .badge.completed {
          background: #dbeafe;
          color: #1e40af;
        }

        .badge.vacant {
          background: #d1fae5;
          color: #065f46;
        }

        .badge.occupied {
          background: #fee2e2;
          color: #991b1b;
        }

        .houses-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }

        .house-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .house-header {
          display: flex;
          gap: 15px;
          padding: 15px;
          border-bottom: 1px solid #e5e7eb;
        }

        .house-image {
          width: 80px;
          height: 60px;
          object-fit: cover;
          border-radius: 8px;
        }

        .house-title h4 {
          margin: 0 0 5px;
          color: #1f2937;
          font-size: 16px;
        }

        .house-title p {
          color: #6b7280;
          margin: 0;
          font-size: 13px;
        }

        .landlord-name {
          color: #3b82f6;
          font-size: 12px;
        }

        .house-details {
          padding: 15px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 14px;
        }

        .booking-status {
          padding: 15px;
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
        }

        .booking-status h5 {
          margin: 0 0 10px;
          color: #374151;
          font-size: 14px;
        }

        .status-bars {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }

        .no-bookings {
          color: #6b7280;
          text-align: center;
          padding: 20px;
          font-size: 14px;
        }

        .total-bookings {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #e5e7eb;
          font-weight: 600;
          color: #1f2937;
          font-size: 14px;
        }

        .loading-container, .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 20px;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .small {
          font-size: 12px;
          color: #6b7280;
          margin: 2px 0;
        }

        .btn {
          padding: 10px 20px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          text-decoration: none;
        }

        .btn-outline {
          background: white;
          border: 1px solid #e5e7eb;
          color: #374151;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-danger {
          background: #dc2626;
          color: white;
        }

        .landlord-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
      `}</style>
    </div>
  );
}