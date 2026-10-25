// src/components/HouseCard.jsx
import React from "react";
import {
  BedDouble,
  MapPin,
  ArrowUpRight,
  Calendar,
  Phone,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function HouseCard({ house }) {
  // Format WhatsApp number
  const whatsappNumber = house.phone
    ? "254" + house.phone.replace(/\D/g, "").replace(/^0/, "")
    : "";

  // Check for valid vacant status
  const isVacant = house.status === "Vacant" || house.status === "available" || house.status === "Available";

  return (
    <article className="house-card">
      {/* Image Link - FIXED TO SHOW FULL IMAGE */}
      <Link to={`/houses/${house.id}`} className="house-image-link">
        <img
          src={house.image || "https://via.placeholder.com/400x300?text=No+Image"}
          alt={house.title}
          loading="lazy"
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/400x300?text=No+Image";
          }}
        />

        <span className={`status-badge ${isVacant ? "vacant" : "occupied"}`}>
          {house.status}
        </span>

        <span className="image-arrow">
          <ArrowUpRight size={18} />
        </span>
      </Link>

      {/* Content */}
      <div className="house-body">
        <div className="house-type">{house.type}</div>

        <Link to={`/houses/${house.id}`}>
          <h3>{house.title}</h3>
        </Link>

        <div className="house-location">
          <MapPin size={15} />
          <span>{house.estate}, Embu</span>
        </div>

        <div className="house-meta">
          <span>
            <BedDouble size={16} />
            {house.rooms} {house.rooms === 1 ? "room" : "rooms"}
          </span>
          <span>{house.distance}</span>
        </div>

        <div className="house-bottom">
          <div>
            <small>Monthly rent</small>
            <strong>KSh {Number(house.rent).toLocaleString()}</strong>
          </div>

          <Link to={`/houses/${house.id}`} className="view-link">
            View
          </Link>
        </div>

        {/* Action Buttons */}
        <div className="house-actions">
          {isVacant && (
            <Link
              to={`/booking/${house.id}`}
              className="btn-action btn-book"
            >
              <Calendar size={16} />
              <span>Book</span>
            </Link>
          )}

          {house.phone && (
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
              className="btn-action btn-whatsapp"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone size={16} />
              <span>WhatsApp</span>
            </a>
          )}
        </div>
      </div>

      <style>{`
        .house-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          height: 100%;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .house-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
        }

        /* ============================================
           IMAGE SECTION - FIXED TO SHOW FULL IMAGE
           ============================================ */
        .house-image-link {
          position: relative;
          display: block;
          width: 100%;
          height: 220px; /* Fixed height that shows more of image */
          overflow: hidden;
          background: #e5e7eb;
          flex-shrink: 0;
        }

        .house-image-link img {
          width: 100%;
          height: 100%;
          object-fit: cover; /* Crops to fill, maintains aspect */
          object-position: center center; /* Centers the crop */
          display: block;
          transition: transform 0.45s ease;
        }

        /* Alternative: Use contain to see full image (may have letterbox) */
        /* Uncomment below and comment out object-fit: cover above */
        /*
        .house-image-link img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: center;
          background: #f3f4f6;
        }
        */

        .house-card:hover .house-image-link img {
          transform: scale(1.05);
        }

        .status-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          z-index: 2;
        }

        .status-badge.vacant {
          color: #126336;
          background: #dff5e5;
        }

        .status-badge.occupied {
          color: #8a3e31;
          background: #f8e3de;
        }

        .image-arrow {
          position: absolute;
          right: 12px;
          bottom: 12px;
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          color: white;
          background: rgba(8, 35, 19, 0.75);
          border-radius: 50%;
          opacity: 0;
          transform: translateY(6px);
          transition: all 0.2s ease;
          z-index: 2;
        }

        .house-card:hover .image-arrow {
          opacity: 1;
          transform: translateY(0);
        }

        /* ============================================
           BODY SECTION
           ============================================ */
        .house-body {
          padding: 16px;
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 0;
        }

        .house-type {
          color: #176b3a;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .house-body h3 {
          margin: 0 0 8px;
          font-size: 17px;
          font-weight: 700;
          color: #111827;
          line-height: 1.3;
          transition: color 0.2s;
        }

        .house-body h3:hover {
          color: #176b3a;
        }

        .house-location {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #68736c;
          font-size: 12px;
          margin-bottom: 12px;
        }

        .house-meta {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          padding: 12px 0;
          border-top: 1px solid #edf0ed;
          border-bottom: 1px solid #edf0ed;
          margin-bottom: 12px;
        }

        .house-meta span {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #68736c;
          font-size: 12px;
        }

        .house-bottom {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .house-bottom small {
          display: block;
          margin-bottom: 2px;
          color: #89938d;
          font-size: 11px;
        }

        .house-bottom strong {
          color: #111827;
          font-size: 18px;
          font-weight: 700;
        }

        .view-link {
          color: #176b3a;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
        }

        /* ============================================
           ACTION BUTTONS
           ============================================ */
        .house-actions {
          display: flex;
          flex-direction: row;
          gap: 8px;
          margin-top: auto;
          padding-top: 12px;
          border-top: 1px solid #edf0ed;
        }

        .btn-action {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.2s ease;
          min-height: 40px;
          border: none;
          cursor: pointer;
        }

        .btn-book {
          background: #176b3a;
          color: white;
        }

        .btn-book:hover {
          background: #0d5a30;
        }

        .btn-whatsapp {
          background: #25d366;
          color: white;
        }

        .btn-whatsapp:hover {
          background: #128c7e;
        }

        /* ============================================
           RESPONSIVE BREAKPOINTS
           ============================================ */
        
        /* Tablet */
        @media (max-width: 768px) {
          .house-image-link {
            height: 200px;
          }

          .house-body {
            padding: 14px;
          }

          .house-body h3 {
            font-size: 16px;
          }

          .btn-action {
            padding: 10px;
            font-size: 11px;
          }
        }

        /* Mobile */
        @media (max-width: 480px) {
          .house-image-link {
            height: 180px;
          }

          .house-body {
            padding: 12px;
          }

          .house-body h3 {
            font-size: 15px;
          }

          .house-bottom strong {
            font-size: 16px;
          }

          .btn-action {
            padding: 10px 8px;
            font-size: 11px;
            gap: 4px;
          }
        }

        /* Very small screens - icons only */
        @media (max-width: 360px) {
          .btn-action {
            padding: 10px;
          }

          .btn-action span {
            display: none;
          }

          .btn-action svg {
            width: 18px;
            height: 18px;
          }
        }
      `}</style>
    </article>
  );
}