// src/pages/AddHouse.jsx
import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  ImagePlus,
  Plus,
  X,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const DRAFT_STORAGE_KEY = "embu_homes_add_house_draft_v2";

const imageFileToDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDimension = 1600;
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Could not prepare the image."));
          return;
        }
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => reject(new Error("Could not decode the selected image."));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error("Failed to read image."));
    reader.readAsDataURL(file);
  });
};

const initialForm = {
  title: "",
  estate: "",
  type: "Single Room",
  rent: "",
  deposit: "",
  distance: "",
  status: "Vacant",
  rooms: 1,
  bathrooms: 1,
  furnished: false,
  water: "24/7",
  electricity: "Prepaid",
  description: "",
  phone: "",
  image: "",
};

export default function AddHouse({ onSaved }) {
  const [form, setForm] = useState(initialForm);
  const [amenities, setAmenities] = useState(["Water", "Electricity", "Security"]);
  const [newAmenity, setNewAmenity] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    setIsAuthenticated(!!(token && userStr));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!savedDraft) return;
      const draft = JSON.parse(savedDraft);
      if (draft.form) setForm({ ...initialForm, ...draft.form });
      if (Array.isArray(draft.amenities)) setAmenities(draft.amenities);
      if (typeof draft.image === 'string' && draft.image) {
        setImagePreview(draft.image);
        setForm((prev) => ({ ...prev, image: draft.image }));
      }
    } catch (error) {
      console.error("Could not restore draft:", error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ form, amenities, image: imagePreview }));
    } catch (error) {
      console.warn("Draft could not be saved:", error);
    }
  }, [form, amenities, imagePreview, isAuthenticated]);

  const change = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB.");
      return;
    }
    setError("");
    try {
      const base64Image = await imageFileToDataUrl(file);
      setImagePreview(base64Image);
      setForm((prev) => ({ ...prev, image: base64Image }));
    } catch (err) {
      setError("Unable to process image. Please try another.");
      setImagePreview("");
    }
  };

  const removeImage = () => {
    setImagePreview("");
    setForm((prev) => ({ ...prev, image: "" }));
  };

  const addAmenity = () => {
    const value = newAmenity.trim();
    if (value && !amenities.includes(value)) {
      setAmenities([...amenities, value]);
      setNewAmenity("");
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!form.title || !form.estate || !form.rent || !form.phone || !form.description) {
      setError("Please fill in all required fields (*).");
      return;
    }
    if (!imagePreview) {
      setError("Please select a house image.");
      return;
    }

    setIsSubmitting(true);

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Session expired. Please login again.");
      setIsAuthenticated(false);
      setIsSubmitting(false);
      return;
    }

    const finalAmenities = [...amenities];
    if (form.water) finalAmenities.push(`Water: ${form.water}`);
    if (form.electricity) finalAmenities.push(`Electricity: ${form.electricity}`);
    if (form.furnished) finalAmenities.push("Furnished");

    const property = {
      title: form.title,
      estate: form.estate,
      type: form.type,
      rent: Number(form.rent),
      deposit: Number(form.deposit || form.rent),
      distance: form.distance,
      status: form.status,
      rooms: Number(form.rooms),
      bathrooms: Number(form.bathrooms),
      description: form.description,
      phone: form.phone,
      image: imagePreview,
      amenities: finalAmenities,
    };

    try {
      const result = await axios.post(`${API_URL}/api/houses`, property, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("House added successfully:", result.data);
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setSuccess(true);
      if (onSaved) await onSaved();
      setTimeout(() => navigate("/landlord"), 2000);
    } catch (err) {
      console.error("Failed to add house:", err);
      if (err.response && err.response.status === 401) {
        setError("Session expired. Please login again.");
        setIsAuthenticated(false);
      } else {
        setError(err.response?.data?.message || "Failed to add property. Please check that the server is running.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <section className="section page-section">
        <div className="container narrow" style={{ textAlign: "center", paddingTop: "80px" }}>
          <div style={{ width: "80px", height: "80px", margin: "0 auto 25px", background: "#fef2f2", borderRadius: "50%", display: "grid", placeItems: "center" }}>
            <X size={40} color="#dc2626" />
          </div>
          <h1 style={{ marginBottom: "15px", color: "#111827" }}>Session Expired</h1>
          <p style={{ color: "#68736c", marginBottom: "30px" }}>Please login again to add a property.</p>
          <Link to="/landlord/login" className="btn btn-primary btn-large">Login</Link>
        </div>
      </section>
    );
  }

  if (success) {
    return (
      <section className="section page-section">
        <div className="container narrow" style={{ textAlign: "center", paddingTop: "80px" }}>
          <div style={{ width: "80px", height: "80px", margin: "0 auto 25px", background: "#e9f6ed", borderRadius: "50%", display: "grid", placeItems: "center" }}>
            <CheckCircle2 size={40} color="#176b3a" />
          </div>
          <h1 style={{ marginBottom: "15px", color: "#111827" }}>Property Added Successfully!</h1>
          <p style={{ color: "#68736c", marginBottom: "30px" }}>Your property has been published and is now visible to students.</p>
          <Link to="/landlord" className="btn btn-primary btn-large">Go to Dashboard</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section page-section">
      <div className="container narrow">
        <Link to="/landlord" className="back-link">
          <ArrowLeft size={17} />
          Dashboard
        </Link>

        <div className="form-heading">
          <span className="eyebrow dark">NEW LISTING</span>
          <h1>Post a student property</h1>
          <p>Give students enough information to decide whether the house fits their needs.</p>
        </div>

        {error && (
          <div className="form-error" style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: "#dc2626" }}>⚠️</span>
            {error}
          </div>
        )}

        <form className="property-form" onSubmit={submit}>
          <div className="form-section">
            <h2>Basic details</h2>
            <div className="form-grid">
              <label className="wide">
                Property title *
                <input name="title" value={form.title} onChange={change} placeholder="e.g. Clean bedsitter near Kangaru" required />
              </label>
              <label>
                Estate / area *
                <input name="estate" value={form.estate} onChange={change} placeholder="Kangaru" required />
              </label>
              <label>
                House type
                <select name="type" value={form.type} onChange={change}>
                  <option>Single Room</option>
                  <option>Bedsitter</option>
                  <option>Hostel</option>
                  <option>1 Bedroom</option>
                  <option>2 Bedroom</option>
                  <option>3 Bedroom</option>
                </select>
              </label>
              <label>
                Monthly rent (KSh) *
                <input type="number" name="rent" value={form.rent} onChange={change} placeholder="5000" min="0" required />
              </label>
              <label>
                Deposit (KSh)
                <input type="number" name="deposit" value={form.deposit} onChange={change} placeholder="5000" min="0" />
              </label>
              <label>
                Approx. distance
                <input name="distance" value={form.distance} onChange={change} placeholder="1.2 km from university" />
              </label>
              <label>
                Availability
                <select name="status" value={form.status} onChange={change}>
                  <option>Vacant</option>
                  <option>Occupied</option>
                </select>
              </label>
              <label>
                Rooms
                <input type="number" name="rooms" value={form.rooms} onChange={change} min="1" />
              </label>
              <label>
                Bathrooms
                <input type="number" name="bathrooms" value={form.bathrooms} onChange={change} min="1" />
              </label>
              <label className="wide">
                Landlord phone *
                <input name="phone" value={form.phone} onChange={change} placeholder="0712 345 678" required />
              </label>
              <label className="wide">
                Description *
                <textarea name="description" value={form.description} onChange={change} rows="5" placeholder="Describe the compound, security, access, nearby services, rules, etc." required />
              </label>
            </div>
          </div>

          <div className="form-section">
            <h2>Property photo *</h2>
            <p className="muted">Upload a clear photo of the property directly from your device.</p>
            {!imagePreview ? (
              <label className="photo-upload-box" htmlFor="house-image">
                <ImagePlus size={38} />
                <strong>Choose house image</strong>
                <span>Click here to select an image from your device</span>
                <small>JPG, PNG, WEBP • Maximum 5MB</small>
                <input id="house-image" type="file" accept="image/*" onChange={handleImageChange} hidden />
              </label>
            ) : (
              <div className="photo-preview-wrapper">
                <img className="preview-image" src={imagePreview} alt="House preview" />
                <div className="photo-actions">
                  <label className="btn btn-outline" htmlFor="change-house-image">
                    <ImagePlus size={16} />
                    Change image
                    <input id="change-house-image" type="file" accept="image/*" onChange={handleImageChange} hidden />
                  </label>
                  <button type="button" className="btn btn-outline remove-photo-btn" onClick={removeImage}>
                    <X size={16} />
                    Remove image
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="form-section">
            <h2>Amenities</h2>
            <div className="amenity-tags">
              {amenities.map((amenity) => (
                <span key={amenity}>
                  {amenity}
                  <button type="button" onClick={() => setAmenities(amenities.filter((a) => a !== amenity))}>
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
            <div className="amenity-add">
              <input
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                placeholder="Add amenity..."
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAmenity(); }}}
              />
              <button type="button" className="btn btn-outline" onClick={addAmenity}>
                <Plus size={16} />
                Add
              </button>
            </div>
          </div>

          <div className="form-actions">
            <Link to="/landlord" className="btn btn-outline">Cancel</Link>
            <button className="btn btn-primary btn-large" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 size={18} className="spin" /> Publishing...</>
              ) : (
                "Publish property"
              )}
            </button>
          </div>
        </form>

        <style>{`
          .spin { animation: spin 1s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .form-actions button:disabled { opacity: 0.7; cursor: not-allowed; }
        `}</style>
      </div>
    </section>
  );
}