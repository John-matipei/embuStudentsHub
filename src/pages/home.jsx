// home.jsx
import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  Search,
  Building2,
  User,
  Code,
  Database,
  Lock,
  Server,
  Phone,
} from "lucide-react";
import { Link } from "react-router-dom";
import HouseCard from "../components/HouseCard";
import axios from "axios";

// CRITICAL: Ensure this matches your backend URL exactly
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const teamMembers = [
  {
    id: 1,
    name: "John Matipei",
    role: "Team Leader / Backend Dev",
    icon: <User size={28} />,
    color: "#dc2626",
    bio: "Oversees system architecture and ensures the platform efficiently serves all landlords and students."
  },
  {
    id: 2,
    name: "Isac Abuga",
    role: "Frontend Dev",
    icon: <Code size={28} />,
    color: "#3b82f6",
    bio: "Designs seamless interfaces that help students find homes and landlords manage listings with ease."
  },
  {
    id: 3,
    name: "Mercy Gicheha",
    role: "Database Admin",
    icon: <Database size={28} />,
    color: "#10b981",
    bio: "Manages the database storing landlord properties, student bookings, and user accounts securely."
  },
  {
    id: 4,
    name: "Rayan",
    role: "Database Admin",
    icon: <Database size={28} />,
    color: "#10b981",
    bio: "Maintains data integrity and optimizes performance for real-time updates across the platform."
  },
  {
    id: 5,
    name: "Justin",
    role: "Cybersecurity Officer",
    icon: <Lock size={28} />,
    color: "#f59e0b",
    bio: "Protects sensitive landlord and student data through continuous security monitoring and threat prevention."
  },
  {
    id: 6,
    name: "Lyn Karimi",
    role: "System Admin",
    icon: <Server size={28} />,
    color: "#8b5cf6",
    bio: "Ensures 24/7 platform availability so landlords can list properties and students can book anytime."
  },
  {
    id: 7,
    name: "Kamau",
    role: "System Admin",
    icon: <Server size={28} />,
    color: "#8b5cf6",
    bio: "Monitors network performance to guarantee reliable service for all landlords and students in Embu."
  }
];

const studentAreas = [
  { name: "Baggik", distance: "0.3 km", time: "4 min walk", color: "#10b981" },
  { name: "Kangaru", distance: "0.8 km", time: "10 min walk", color: "#3b82f6" },
  { name: "G-town", distance: "1.5 km", time: "18 min walk", color: "#f59e0b" },
  { name: "Iveche", distance: "2.5 km", time: "30 min walk", color: "#8b5cf6" },
  { name: "Kamiu", distance: "3.5 km", time: "42 min walk", color: "#ef4444" },
];

export default function Home() {
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [serverStatus, setServerStatus] = useState("unknown");

  useEffect(() => {
    const fetchHouses = async () => {
      try {
        setError("");
        setServerStatus("checking");
        
        // Attempt to fetch houses
        const response = await axios.get(`${API_URL}/api/houses`);
        
        // Validate response data
        if (!Array.isArray(response.data)) {
          throw new Error("Invalid data format received from server");
        }
        
        setHouses(response.data);
        setServerStatus("ok");
      } catch (err) {
        console.error("Error fetching houses:", err);
        
        // Specific error handling
        if (err.response) {
          // Server responded with an error status (4xx, 5xx)
          if (err.response.status === 500) {
            setError("Server error occurred. The backend is running but encountered a database issue. Please check server logs.");
          } else if (err.response.status === 403 || err.response.status === 401) {
            setError("Access denied. You may not have permission to view this content.");
          } else {
            setError(`Server error: ${err.response.status}. Please try again later.`);
          }
        } else if (err.request) {
          // Request was made but no response received
          setError("Cannot connect to the server. Ensure the backend is running on port 5000.");
        } else {
          // Other errors
          setError("An unexpected error occurred. Please try again.");
        }
        setServerStatus("error");
      } finally {
        setLoading(false);
      }
    };

    fetchHouses();
  }, []);

  // Filter for valid vacant/available houses
  const vacant = houses.filter((h) => 
    h.status === "Vacant" || h.status === "available" || h.status === "Available"
  );
  const featured = vacant.slice(0, 3);

  const firstSix = teamMembers.slice(0, 6);
  const lastOne = teamMembers.slice(6, 7);

  if (loading) {
    return (
      <div className="container loading-container">
        <div className="loading-spinner"></div>
        <p>Loading available houses...</p>
        <style>{`
          .loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; }
          .loading-spinner { width: 50px; height: 50px; border: 4px solid #e0e7e1; border-top-color: #176b3a; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container error-container">
        <h2 style={{ color: "#b91c1c", marginBottom: "15px" }}>Connection Error</h2>
        <p style={{ color: "#68736c", marginBottom: "25px" }}>{error}</p>
        <div style={{ marginBottom: "20px" }}>
          <p style={{ fontSize: "14px", color: "#89938d" }}>
            If you are the developer, check the following:
          </p>
          <ul style={{ fontSize: "13px", color: "#68736c", lineHeight: "1.6" }}>
            <li>1. Is the backend server running on port 5000?</li>
            <li>2. Is the database connected and tables created?</li>
            <li>3. Check the backend terminal for specific error logs.</li>
          </ul>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="btn btn-primary"
        >
          Try Again
        </button>
        <button 
          onClick={() => window.open('http://localhost:5000/api/health', '_blank')}
          className="btn btn-outline"
          style={{ marginLeft: '10px' }}
        >
          Test Backend Connection
        </button>
      </div>
    );
  }

  return (
    <>
      <section className="hero">
        <div className="hero-overlay"></div>

        <div className="container hero-content">
          <div className="hero-copy">
            <span className="eyebrow">
              STUDENT LIVING · EMBU COUNTY
            </span>

            <h1>
              Find a place you'll be happy to{" "}
              <span>call home.</span>
            </h1>

            <p>
              Discover vacant houses, bedsitters and hostels around
              the University of Embu with rent, distance, amenities
              and landlord contacts in one place.
            </p>

            <div className="hero-actions">
              <Link
                to="/houses"
                className="btn btn-primary btn-large"
              >
                <Search size={19} />
                Find a house
              </Link>

              <Link
                to="/landlord/login"
                className="btn btn-glass btn-large"
              >
                List your property
                <ArrowRight size={18} />
              </Link>
            </div>

            <div className="trust-row">
              <span>
                <CheckCircle2 size={17} />
                Vacancy information
              </span>

              <span>
                <Building2 size={17} />
                Landlord portal
              </span>

              <span>
                <MapPin size={17} />
                Embu locations
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-strip">
        <div className="container stats">
          <div>
            <strong>{vacant.length}</strong>
            <span>Vacant listings</span>
          </div>

          <div>
            <strong>
              {new Set(houses.map((h) => h.estate)).size}
            </strong>
            <span>Estates</span>
          </div>

          <div>
            <strong>24/7</strong>
            <span>Online access</span>
          </div>

          <div>
            <strong>Free</strong>
            <span>For students to search</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow dark">
                LATEST LISTINGS
              </span>

              <h2>Popular student homes</h2>

              <p>
                Start with these available properties around
                University of Embu.
              </p>
            </div>

            <Link className="text-link" to="/houses">
              View all
              <ArrowRight size={17} />
            </Link>
          </div>

          <div className="house-grid">
            {featured.map((house) => (
              <HouseCard
                key={house.id}
                house={house}
              />
            ))}
          </div>
        </div>
      </section>

      {/* MAP SECTION - Clean Map with Area List */}
      <section className="section map-section-clean">
        <div className="container">
          <div className="section-heading centered">
            <span className="eyebrow dark">
              <MapPin size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              STUDENT AREAS
            </span>

            <h2>Areas Near University of Embu</h2>

            <p>
              Find housing in these student-friendly neighborhoods around campus.
              Listed from closest to farthest.
            </p>
          </div>

          {/* Large Map */}
          <div className="map-container-clean">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15955.1!2d37.4561!3d-0.5031!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x18262c5d0c1e6c3d%3A0x5e5e5e5e5e5e5e5e!2sUniversity%20of%20Embu!5e0!3m2!1sen!2ske!4v1699999999999!5m2!1sen!2ske"
              width="100%"
              height="500"
              style={{ border: 0, borderRadius: '16px' }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="University of Embu Map"
            ></iframe>
          </div>

          {/* Simple Area List with Distances - ORDERED CLOSEST TO FARTHEST */}
          <div className="area-list-clean">
            {studentAreas.map((area, index) => (
              <div key={index} className="area-item-clean">
                <div className="area-rank">{index + 1}</div>
                <div className="area-dot" style={{ backgroundColor: area.color }}></div>
                <div className="area-info">
                  <span className="area-name">{area.name}</span>
                  <span className="area-distance">{area.distance}</span>
                </div>
                <span className="area-time">{area.time}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MEET THE TEAM SECTION */}
      <section className="section team-section">
        <div className="container">
          <div className="section-heading centered">
            <span className="eyebrow dark">
              OUR TEAM
            </span>

            <h2>Meet the minds behind Embu Student Homes</h2>

            <p>
              A dedicated team of professionals committed to revolutionizing 
              student accommodation in Embu.
            </p>
          </div>

          {/* First 6 members - 3x2 grid */}
          <div className="team-grid-six">
            {firstSix.map((member) => (
              <div key={member.id} className="team-card-simple">
                <div 
                  className="team-icon-circle"
                  style={{ backgroundColor: `${member.color}15`, color: member.color }}
                >
                  {member.icon}
                </div>
                <h3>{member.name}</h3>
                <p className="team-role-simple" style={{ color: member.color }}>
                  {member.role}
                </p>
                <p className="team-bio-simple">{member.bio}</p>
              </div>
            ))}
          </div>

          {/* Last member - centered */}
          <div className="team-grid-single">
            {lastOne.map((member) => (
              <div key={member.id} className="team-card-simple team-card-center">
                <div 
                  className="team-icon-circle"
                  style={{ backgroundColor: `${member.color}15`, color: member.color }}
                >
                  {member.icon}
                </div>
                <h3>{member.name}</h3>
                <p className="team-role-simple" style={{ color: member.color }}>
                  {member.role}
                </p>
                <p className="team-bio-simple">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section soft-section">
        <div className="container">
          <div className="section-heading centered">
            <span className="eyebrow dark">
              HOW IT WORKS
            </span>

            <h2>
              Simple for students. Useful for landlords.
            </h2>
          </div>

          <div className="steps">
            <Step
              icon={<Search />}
              title="Search"
              text="Filter by estate, house type, rent and vacancy."
            />

            <Step
              icon={<Building2 />}
              title="Compare"
              text="Check photos, amenities, distance and house details."
            />

            <Step
              icon={<Phone />}
              title="Contact"
              text="Get the landlord contact and arrange a viewing."
            />
          </div>
        </div>
      </section>
    </>
  );
}

function Step({ icon, title, text }) {
  return (
    <div className="step">
      <span className="step-icon">
        {icon}
      </span>

      <h3>{title}</h3>

      <p>{text}</p>
    </div>
  );
}