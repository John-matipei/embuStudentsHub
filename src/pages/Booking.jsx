// src/pages/Booking.jsx
import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  MessageSquare,
  CheckCircle2,
  Home
} from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Booking() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [house, setHouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    preferredDate: "",
    preferredTime: "",
    message: "",
    studentId: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const fetchHouse = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await axios.get(`${API_URL}/api/houses/${id}`);
        setHouse(response.data);
      } catch (err) {
        console.error("Error fetching house details:", err);
        setError("House not found or unavailable.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchHouse();
    } else {
      setError("No house ID provided.");
      setLoading(false);
    }
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.preferredDate) {
      setError("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await axios.post(`${API_URL}/api/bookings`, {
        houseId: house.id,
        ...formData,
      });
      
      setIsSuccess(true);
    } catch (err) {
      console.error("Booking error:", err);
      setError(err.response?.data?.message || "Failed to submit booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="container loading-container">
        <div className="loading-spinner"></div>
        <p>Loading house details...</p>
        <style>{`
          .loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; }
          .loading-spinner { width: 50px; height: 50px; border: 4px solid #e0e7e1; border-top-color: #176b3a; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (error || !house) {
    return (
      <section className="section page-section">
        <div className="container empty">
          <h2>House not found</h2>
          <p>The property you are looking for does not exist or has been removed.</p>
          <Link to="/houses" className="btn btn-primary">Browse available houses</Link>
        </div>
      </section>
    );
  }

  if (isSuccess) {
    return (
      <section className="section page-section">
        <div className="container narrow">
          <div className="booking-success">
            <CheckCircle2 size={64} color="#176b3a" />
            <h1>Booking Request Sent!</h1>
            <p>Thank you, {formData.name}. Your viewing request for <strong>{house.title}</strong> has been sent to the landlord.</p>
            <p>They will contact you at <strong>{formData.phone}</strong> to confirm your appointment for <strong>{formData.preferredDate}</strong>.</p>
            <Link to="/houses" className="btn btn-primary btn-large">Browse more houses</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section page-section">
      <div className="container narrow">
        <Link to={`/houses/${house.id}`} className="back-link">
          <ArrowLeft size={17} />
          Back to house details
        </Link>

        <div className="booking-header">
          <span className="eyebrow dark">BOOK VIEWING</span>
          <h1>Schedule a House Viewing</h1>
          <p>Fill in your details and preferred time to visit this property.</p>
        </div>

        <div className="booking-house-card">
          <img src={house.image} alt={house.title} />
          <div className="booking-house-info">
            <span className="house-type">{house.type}</span>
            <h3>{house.title}</h3>
            <p><Home size={14} /> {house.estate}, Embu</p>
            <p className="booking-price">KSh {Number(house.rent).toLocaleString()}/month</p>
          </div>
        </div>

        <form className="booking-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h2>Your Information</h2>
            <div className="form-grid">
              <label className="wide">
                <User size={16} />
                Full Name *
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" required />
              </label>
              <label>
                <Phone size={16} />
                Phone Number *
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="0712 345 678" required />
              </label>
              <label>
                <Mail size={16} />
                Email (optional)
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" />
              </label>
              <label>
                Student ID (optional)
                <input type="text" name="studentId" value={formData.studentId} onChange={handleChange} placeholder="EBU/2024/12345" />
              </label>
            </div>
          </div>

          <div className="form-section">
            <h2>Preferred Viewing Time</h2>
            <div className="form-grid">
              <label>
                <Calendar size={16} />
                Preferred Date *
                <input type="date" name="preferredDate" value={formData.preferredDate} onChange={handleChange} min={minDate} max={maxDateStr} required />
              </label>
              <label>
                <Clock size={16} />
                Preferred Time
                <select name="preferredTime" value={formData.preferredTime} onChange={handleChange}>
                  <option value="">Any time</option>
                  <option value="morning">Morning (8am - 12pm)</option>
                  <option value="afternoon">Afternoon (12pm - 5pm)</option>
                  <option value="evening">Evening (5pm - 7pm)</option>
                </select>
              </label>
              <label className="wide">
                <MessageSquare size={16} />
                Additional Message (optional)
                <textarea name="message" value={formData.message} onChange={handleChange} rows="3" placeholder="Any specific questions or requests for the landlord..." />
              </label>
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="booking-notice">
            <p><strong>Note:</strong> The landlord will contact you to confirm the viewing appointment. Please arrive on time and bring your student ID if you have one.</p>
          </div>

          <div className="form-actions">
            <Link to={`/houses/${house.id}`} className="btn btn-outline">Cancel</Link>
            <button type="submit" className="btn btn-primary btn-large" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Request Viewing"}
            </button>
          </div>
        </form>

        <style>{`
          .booking-success { text-align: center; padding: 60px 20px; }
          .booking-success h1 { margin: 20px 0 15px; font-size: 32px; }
          .booking-success p { color: #68736c; margin-bottom: 15px; max-width: 500px; margin-left: auto; margin-right: auto; }
          .booking-header { margin-bottom: 25px; }
          .booking-header h1 { margin: 8px 0 10px; font-size: clamp(28px, 4vw, 40px); }
          .booking-house-card { display: flex; gap: 20px; padding: 20px; background: #f8faf9; border: 1px solid #e0e7e1; border-radius: 16px; margin-bottom: 25px; }
          .booking-house-card img { width: 140px; height: 100px; object-fit: cover; border-radius: 12px; }
          .booking-house-info { flex: 1; }
          .booking-house-info .house-type { color: #176b3a; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
          .booking-house-info h3 { margin: 5px 0 8px; font-size: 18px; }
          .booking-house-info p { color: #68736c; font-size: 13px; margin: 0 0 5px; display: flex; align-items: center; gap: 6px; }
          .booking-price { color: #176b3a !important; font-weight: 700; font-size: 15px !important; }
          .booking-form .form-section { margin-bottom: 20px; }
          .booking-form label { display: flex; flex-direction: column; gap: 8px; font-size: 13px; font-weight: 700; color: #374151; }
          .booking-form label svg { color: #176b3a; }
          .booking-form input, .booking-form select, .booking-form textarea { width: 100%; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 10px; font-size: 14px; outline: none; transition: border-color 0.2s; }
          .booking-form input:focus, .booking-form select:focus, .booking-form textarea:focus { border-color: #176b3a; box-shadow: 0 0 0 3px rgba(23, 107, 58, 0.1); }
          .booking-notice { padding: 16px; background: #e9f6ed; border-radius: 12px; margin-bottom: 20px; }
          .booking-notice p { margin: 0; font-size: 13px; color: #365240; line-height: 1.6; }
          @media (max-width: 600px) {
            .booking-house-card { flex-direction: column; }
            .booking-house-card img { width: 100%; height: 180px; }
          }
        `}</style>
      </div>
    </section>
  );
}