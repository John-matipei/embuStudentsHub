// src/pages/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [activeTab, setActiveTab] = useState('houses');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Form state for houses only (Landlords/Logs are view-only)
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);

  // Check login status on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      const user = JSON.parse(userStr);
      if (user.role !== 'admin') {
        setMessage('Access Denied: Admin privileges required. Your account role is: ' + (user.role || 'undefined'));
        handleLogout();
        return;
      }
      setIsLoggedIn(true);
      setIsAdmin(true);
      fetchData('houses'); // Default load
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, loginForm);
      const user = response.data.landlord;
      
      if (user.role !== 'admin') {
        setMessage('Access Denied: You do not have admin privileges.');
        return;
      }

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setIsLoggedIn(true);
      setIsAdmin(true);
      setMessage('');
      fetchData('houses');
    } catch (error) {
      setMessage('Login failed: ' + (error.response?.data?.message || 'Invalid credentials'));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setIsAdmin(false);
    setData([]);
    setFormData({});
    setEditingId(null);
  };

  const fetchData = async (tab) => {
    setLoading(true);
    setActiveTab(tab);
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      let url = '';
      
      if (tab === 'houses') {
        // We fetch all houses (including unavailable) for admin oversight
        // Note: Your server /api/houses might filter by status. 
        // You may need a new admin-specific endpoint like /api/admin/houses-all if you want to see deleted/archived ones.
        // For now, we use the standard endpoint which the admin is authorized to use.
        url = `${API_URL}/api/houses`; 
      } else if (tab === 'bookings') {
        url = `${API_URL}/api/bookings`;
      } else if (tab === 'landlords') {
        url = `${API_URL}/api/admin/landlords`;
      } else if (tab === 'logs') {
        url = `${API_URL}/api/admin/security-logs`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
    } catch (error) {
      setMessage('Failed to fetch data: ' + (error.response?.data?.message || error.message));
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHouse = async (id) =>{
    if (!window.confirm('Are you sure you want to delete this house? This action cannot be undone.')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/houses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('House deleted successfully.');
      fetchData('houses');
    } catch (error) {
      setMessage('Delete failed: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleUpdateBookingStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/bookings/${id}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(`Booking ${status}.`);
      fetchData('bookings');
    } catch (error) {
      setMessage('Update failed: ' + (error.response?.data?.message || error.message));
    }
  };

  // --- Render Helpers ---

  if (!isLoggedIn) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f5f5f5' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', width: '400px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>Admin Access Only</h2>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '15px' }}>
              <input
                type="email"
                placeholder="Admin Email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                required
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                required
              />
            </div>
            <button type="submit" style={{ width: '100%', padding: '12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer' }}>
              Login
            </button>
          </form>
          {message && <p style={{ color: '#dc3545', marginTop: '15px', textAlign: 'center' }}>{message}</p>}
          <p style={{ textAlign: 'center', marginTop: '20px', color: '#666', fontSize: '14px' }}>
            Only authorized administrators can access this panel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: '2px solid #eee' }}>
        <h1 style={{ margin: 0, color: '#333' }}>Admin Dashboard</h1>
        <button onClick={handleLogout} style={{ padding: '10px 20px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>

      {message && (
        <div style={{ padding: '12px', background: message.includes('failed') ? '#f8d7da' : '#d4edda', color: message.includes('failed') ? '#721c24' : '#155724', borderRadius: '4px', marginBottom: '20px' }}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        <button
          onClick={() => fetchData('houses')}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            background: activeTab === 'houses' ? '#007bff' : '#f0f0f0',
            color: activeTab === 'houses' ? 'white' : '#333',
            fontSize: '14px'
          }}
        >
          Manage Houses
        </button>
        <button
          onClick={() => fetchData('bookings')}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            background: activeTab === 'bookings' ? '#007bff' : '#f0f0f0',
            color: activeTab === 'bookings' ? 'white' : '#333',
            fontSize: '14px'
          }}
        >
          View Bookings
        </button>
        <button
          onClick={() => fetchData('landlords')}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            background: activeTab === 'landlords' ? '#007bff' : '#f0f0f0',
            color: activeTab === 'landlords' ? 'white' : '#333',
            fontSize: '14px'
          }}
        >
          View Landlords
        </button>
        <button
          onClick={() => fetchData('logs')}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            background: activeTab === 'logs' ? '#007bff' : '#f0f0f0',
            color: activeTab === 'logs' ? 'white' : '#333',
            fontSize: '14px'
          }}
        >
          Security Logs
        </button>
      </div>

      {loading ? (
        <p>Loading data...</p>
      ) : (
        <>
          {/* HOUSES MANAGEMENT */ }
          {activeTab === 'houses' && (
            <div>
              <h2>Manage Houses</h2>
              <p style={{ marginBottom: '20px', color: '#666' }}>
                Note: For security and data integrity, direct database editing of houses via this form is disabled. 
                Please use the main Landlord Dashboard to add/edit houses. 
                This view is for monitoring and deletion only.
              </p>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>ID</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Title</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Estate</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Rent</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center' }}>No houses found.</td></tr>
                  ) : (
                    data.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                        <td style={{ padding: '12px' }}>{item.id}</td>
                        <td style={{ padding: '12px' }}>{item.title}</td>
                        <td style={{ padding: '12px' }}>{item.estate}</td>
                        <td style={{ padding: '12px' }}>KSh {item.rent}</td>
                        <td style={{ padding: '12px' }}>{item.status}</td>
                        <td style={{ padding: '12px' }}>
                          <button 
                            onClick={() => handleDeleteHouse(item.id)}
                            style={{ padding: '5px 10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* BOOKINGS MANAGEMENT */ }
          {activeTab === 'bookings' && (
            <div>
              <h2>Booking Requests</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>ID</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>House</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Phone</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center' }}>No bookings found.</td></tr>
                  ) : (
                    data.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                        <td style={{ padding: '12px' }}>{item.id}</td>
                        <td style={{ padding: '12px' }}>{item.houseTitle || item.house_id}</td>
                        <td style={{ padding: '12px' }}>{item.name}</td>
                        <td style={{ padding: '12px' }}>{item.phone}</td>
                        <td style={{ padding: '12px' }}>{item.status}</td>
                        <td style={{ padding: '12px' }}>
                          {item.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleUpdateBookingStatus(item.id, 'approved')}
                                style={{ padding: '5px 10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' }}
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => handleUpdateBookingStatus(item.id, 'rejected')}
                                style={{ padding: '5px 10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {item.status !== 'pending' && <span style={{ color: '#28a745' }}>Handled</span>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* LANDlords VIEW ONLY */ }
          {activeTab === 'landlords' && (
            <div>
              <h2>Registered Landlords</h2>
              <p style={{ marginBottom: '20px', color: '#666' }}>View only. To manage users, contact the system administrator or use the database directly.</p>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>ID</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center' }}>No data found.</td></tr>
                  ) : (
                    data.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                        <td style={{ padding: '12px' }}>{item.id}</td>
                        <td style={{ padding: '12px' }}>{item.name}</td>
                        <td style={{ padding: '12px' }}>{item.email}</td>
                        <td style={{ padding: '12px' }}>{item.role}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* SECURITY LOGS VIEW ONLY */ }
          {activeTab === 'logs' && (
            <div>
              <h2>Security Logs</h2>
              <p style={{ marginBottom: '20px', color: '#666' }}>View only. Logs are generated automatically by the system.</p>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>ID</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Action</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>IP Address</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Success</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>No logs found.</td></tr>
                  ) : (
                    data.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                        <td style={{ padding: '12px' }}>{item.id}</td>
                        <td style={{ padding: '12px' }}>{item.action}</td>
                        <td style={{ padding: '12px' }}>{item.ip_address || 'N/A'}</td>
                        <td style={{ padding: '12px' }}>{item.success ? 'Yes' : 'No'}</td>
                        <td style={{ padding: '12px' }}>{item.created_at}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}