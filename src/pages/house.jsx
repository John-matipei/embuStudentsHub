// src/pages/Houses.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Filter,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import HouseCard from "../components/HouseCard";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Houses() {
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filter states
  const [query, setQuery] = useState("");
  const [estate, setEstate] = useState("All");
  const [type, setType] = useState("All");
  const [status, setStatus] = useState("All");
  const [maxRent, setMaxRent] = useState("20000");
  const [mobileFilters, setMobileFilters] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    const fetchHouses = async () => {
      try {
        setError("");
        const response = await axios.get(`${API_URL}/api/houses`);
        if (Array.isArray(response.data)) {
          setHouses(response.data);
        } else {
          throw new Error("Invalid data received");
        }
      } catch (err) {
        setError("Failed to load houses. Ensure the backend is running.");
        console.error("Error fetching houses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHouses();
  }, []);

  const estates = ["All", ...new Set(houses.map((h) => h.estate))].filter(Boolean);
  const types = ["All", ...new Set(houses.map((h) => h.type))].filter(Boolean);

  const results = useMemo(() => {
    return houses.filter((house) => {
      const text = `${house.title} ${house.estate} ${house.type} ${house.description}`.toLowerCase();
      const isValidStatus = house.status === "Vacant" || house.status === "available" || house.status === "Available";
      const statusMatch = status === "All" || (status === "Vacant" && isValidStatus) || (status === "Occupied" && house.status === "Occupied");

      return (
        text.includes(query.toLowerCase()) &&
        (estate === "All" || house.estate === estate) &&
        (type === "All" || house.type === type) &&
        statusMatch &&
        Number(house.rent) <= Number(maxRent)
      );
    });
  }, [houses, query, estate, type, status, maxRent]);

  const resetFilters = () => {
    setEstate("All");
    setType("All");
    setStatus("All");
    setMaxRent("20000");
    setQuery("");
  };

  if (loading) {
    return (
      <div className="container loading-container">
        <div className="loading-spinner"></div>
        <p>Loading listings...</p>
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
        <h2 style={{ color: "#b91c1c" }}>Error</h2>
        <p style={{ color: "#68736c" }}>{error}</p>
        <button onClick={() => window.location.reload()} className="btn btn-primary">Try Again</button>
      </div>
    );
  }

  return (
    <section className="section page-section">
      <div className="container">
        <div className="page-heading">
          <div>
            <span className="eyebrow dark">EXPLORE EMBU</span>
            <h1>Find your next student home</h1>
            <p>Search houses and hostels by location, price and availability.</p>
          </div>
          <button className="filter-mobile-btn" onClick={() => setMobileFilters(true)}>
            <SlidersHorizontal size={18} />
            Filters
          </button>
        </div>

        <div className="search-bar">
          <Search size={20} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by estate, house type or keyword..."
          />
        </div>

        {/* Filter Drawer (Mobile) */}
        <div className={mobileFilters ? "filter-drawer show" : "filter-drawer"}>
          <div className="filter-title">
            Filters
            <button onClick={() => setMobileFilters(false)}><X /></button>
          </div>
          <FilterControls
            estate={estate} setEstate={setEstate} estates={estates}
            type={type} setType={setType} types={types}
            status={status} setStatus={setStatus}
            maxRent={maxRent} setMaxRent={setMaxRent}
          />
          <button className="btn btn-primary reset" onClick={() => { resetFilters(); setMobileFilters(false); }}>
            Reset filters
          </button>
        </div>

        <div className="listing-layout">
          {/* Desktop Filters */}
          <aside className="desktop-filters">
            <div className="filter-title">Filters</div>
            <FilterControls
              estate={estate} setEstate={setEstate} estates={estates}
              type={type} setType={setType} types={types}
              status={status} setStatus={setStatus}
              maxRent={maxRent} setMaxRent={setMaxRent}
            />
            <button className="btn btn-outline reset" onClick={resetFilters}>Reset</button>
          </aside>

          {/* Results */}
          <div>
            <div className="result-row">
              <span><strong>{results.length}</strong> homes found</span>
              <span className="result-note"><Filter size={15} /> Updated listings</span>
            </div>

            <div className="house-grid">
              {results.map((house) => (
                <HouseCard key={house.id} house={house} />
              ))}
            </div>

            {!results.length && (
              <div className="empty">
                <h3>No homes found</h3>
                <p>Try increasing your maximum rent or changing the filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function FilterControls({ estate, setEstate, estates, type, setType, types, status, setStatus, maxRent, setMaxRent }) {
  return (
    <>
      <label>
        Estate
        <select value={estate} onChange={(e) => setEstate(e.target.value)}>
          {estates.map((item) => <option key={item}>{item}</option>)}
        </select>
      </label>
      <label>
        House type
        <select value={type} onChange={(e) => setType(e.target.value)}>
          {types.map((item) => <option key={item}>{item}</option>)}
        </select>
      </label>
      <label>
        Availability
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option>All</option>
          <option>Vacant</option>
          <option>Occupied</option>
        </select>
      </label>
      <label>
        Maximum rent
        <strong>KSh {Number(maxRent).toLocaleString()}</strong>
        <input
          type="range"
          min="2000"
          max="30000"
          step="500"
          value={maxRent}
          onChange={(e) => setMaxRent(e.target.value)}
        />
      </label>
    </>
  );
}