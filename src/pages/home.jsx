//FROM HELLO WORLD TO A REAL PROGRAM INDEED YOU DID IT TO ME THANK YOU GOD
import React, { useState } from "react";
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
  Navigation,
  Clock,
  Car,
} from "lucide-react";
import { Link } from "react-router-dom";
import HouseCard from "../components/HouseCard";

// Custom Walking Icon (since Walk is not in lucide-react)
function WalkingIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="13" cy="4" r="2" />
      <path d="M7 21l3-4" />
      <path d="M16 21l-2-4" />
      <path d="M10 17l-2-4 3-3 2 2 3-3" />
    </svg>
  );
}

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

// Student areas near University of Embu with accurate distances
const studentAreas = [
  {
    id: 1,
    name: "Kangaru",
    distance: "0.5 km",
    walkingTime: "6 min",
    drivingTime: "2 min",
    description: "Closest to campus, right opposite the university gate",
    lat: -0.498,
    lng: 37.458,
    color: "#10b981",
    popular: true
  },
  {
    id: 2,
    name: "Dallas",
    distance: "2.3 km",
    walkingTime: "28 min",
    drivingTime: "5 min",
    description: "Popular student area with affordable bedsitters",
    lat: -0.485,
    lng: 37.460,
    color: "#3b82f6",
    popular: true
  },
  {
    id: 3,
    name: "Samarity / Shauri Yako",
    distance: "2.5 km",
    walkingTime: "30 min",
    drivingTime: "6 min",
    description: "Budget-friendly hostels and shared rooms",
    lat: -0.480,
    lng: 37.462,
    color: "#f59e0b",
    popular: false
  },
  {
    id: 4,
    name: "Muthatari",
    distance: "3.5 km",
    walkingTime: "42 min",
    drivingTime: "8 min",
    description: "Near KEPHIS Embu, growing student community",
    lat: -0.475,
    lng: 37.465,
    color: "#8b5cf6",
    popular: false
  },
  {
    id: 5,
    name: "Majengo",
    distance: "3.8 km",
    walkingTime: "45 min",
    drivingTime: "9 min",
    description: "Busy area with many rental options",
    lat: -0.470,
    lng: 37.455,
    color: "#ef4444",
    popular: false
  },
  {
    id: 6,
    name: "Embu Town",
    distance: "3.2 km",
    walkingTime: "38 min",
    drivingTime: "7 min",
    description: "Central location with shops and transport",
    lat: -0.465,
    lng: 37.450,
    color: "#dc2626",
    popular: true
  },
  {
    id: 7,
    name: "Blue Valley",
    distance: "4.5 km",
    walkingTime: "55 min",
    drivingTime: "10 min",
    description: "Quieter area, good for focused study",
    lat: -0.460,
    lng: 37.445,
    color: "#06b6d4",
    popular: false
  },
  {
    id: 8,
    name: "Kiritiri",
    distance: "6.0 km",
    walkingTime: "75 min",
    drivingTime: "12 min",
    description: "Fast-developing with new hostels",
    lat: -0.455,
    lng: 37.440,
    color: "#84cc16",
    popular: false
  }
];

export default function Home({ houses }) {
  const vacant = houses.filter((h) => h.status === "Vacant");
  const featured = vacant.slice(0, 3);

  // Split team into first 6 and last 1 for layout
  const firstSix = teamMembers.slice(0, 6);
  const lastOne = teamMembers.slice(6, 7);

  const [selectedArea, setSelectedArea] = useState(null);
  const [travelMode, setTravelMode] = useState("walking"); // walking or driving

  const getGoogleMapsUrl = (area) => {
    const destination = `${area.lat},${area.lng}`;
    const origin = "-0.5031,37.4561"; // University of Embu
    const mode = travelMode === "walking" ? "walking" : "driving";
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=${mode}`;
  };

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

          {!featured.length && (
            <div className="empty">
              No vacant houses have been listed yet.
            </div>
          )}
        </div>
      </section>

      {/* MAP SECTION - Student Areas Near University */}
      <section className="section map-section">
        <div className="container">
          <div className="section-heading centered">
            <span className="eyebrow dark">
              <MapPin size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              STUDENT AREAS
            </span>

            <h2>Find Housing Near University of Embu</h2>

            <p>
              Explore student-friendly neighborhoods with accurate distances 
              from campus. Click any area to get directions.
            </p>
          </div>

          {/* Map Container */}
          <div className="map-container">
            <div className="map-wrapper">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15955.1!2d37.4561!3d-0.5031!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x18262c5d0c1e6c3d%3A0x5e5e5e5e5e5e5e5e!2sUniversity%20of%20Embu!5e0!3m2!1sen!2ske!4v1699999999999!5m2!1sen!2ske"
                width="100%"
                height="450"
                style={{ border: 0, borderRadius: '12px' }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="University of Embu Map"
              ></iframe>
              
              {/* University Marker Overlay */}
              <div className="university-marker">
                <div className="marker-pin">
                  <MapPin size={24} color="#dc2626" />
                </div>
                <div className="marker-label">University of Embu</div>
              </div>
            </div>
          </div>

          {/* Travel Mode Toggle */}
          <div className="travel-mode-toggle">
            <button 
              className={`mode-btn ${travelMode === 'walking' ? 'active' : ''}`}
              onClick={() => setTravelMode('walking')}
            >
              <WalkingIcon size={18} />
              Walking
            </button>
            <button 
              className={`mode-btn ${travelMode === 'driving' ? 'active' : ''}`}
              onClick={() => setTravelMode('driving')}
            >
              <Car size={18} />
              Driving
            </button>
          </div>

          {/* Area Cards Grid */}
          <div className="areas-grid">
            {studentAreas.map((area) => (
              <div 
                key={area.id} 
                className={`area-card ${selectedArea?.id === area.id ? 'selected' : ''} ${area.popular ? 'popular' : ''}`}
                onClick={() => setSelectedArea(area)}
              >
                <div className="area-header">
                  <div className="area-color-dot" style={{ backgroundColor: area.color }}></div>
                  <h3>{area.name}</h3>
                  {area.popular && <span className="popular-badge">Popular</span>}
                </div>
                
                <div className="area-distance">
                  <Navigation size={16} />
                  <strong>{area.distance}</strong>
                  <span>from campus</span>
                </div>

                <div className="area-time">
                  <Clock size={14} />
                  <span>
                    {travelMode === 'walking' ? area.walkingTime : area.drivingTime}
                  </span>
                </div>

                <p className="area-description">{area.description}</p>

                <a 
                  href={getGoogleMapsUrl(area)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="area-directions-btn"
                  onClick={(e) => e.stopPropagation()}
                >
                  Get Directions
                  <ArrowRight size={14} />
                </a>
              </div>
            ))}
          </div>

          {/* Selected Area Detail */}
          {selectedArea && (
            <div className="selected-area-detail">
              <h3>
                <MapPin size={20} color={selectedArea.color} />
                {selectedArea.name}
              </h3>
              <p>{selectedArea.description}</p>
              <div className="detail-stats">
                <div>
                  <strong>Distance:</strong> {selectedArea.distance}
                </div>
                <div>
                  <strong>Walking:</strong> {selectedArea.walkingTime}
                </div>
                <div>
                  <strong>Driving:</strong> {selectedArea.drivingTime}
                </div>
              </div>
              <a 
                href={getGoogleMapsUrl(selectedArea)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                <Navigation size={16} />
                Open in Google Maps
              </a>
            </div>
          )}
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
              icon={<PhoneIcon />}
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

function PhoneIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect
        x="6"
        y="2"
        width="12"
        height="20"
        rx="2"
      />

      <path d="M11 18h2" />
    </svg>
  );
}