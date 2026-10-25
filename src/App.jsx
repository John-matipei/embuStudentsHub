import React, { useState, useEffect, useCallback } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import ChangePassword from "./pages/ChangePassword";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin"; // NEW: Admin Login Page
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

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Navbar />

        <main>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/houses" element={<Houses />} />
            <Route path="/houses/:id" element={<HouseDetails />} />
            <Route path="/booking/:id" element={<Booking />} />
            
            {/* Landlord routes */}
            <Route path="/landlord/login" element={<LandlordLogin />} />
            <Route path="/landlord" element={<LandlordDashboard />} />
            <Route path="/landlord/bookings" element={<LandlordBookings />} />
            <Route path="/landlord/add" element={<AddHouse />} />
            <Route path="/landlord/change-password" element={<ChangePassword />} />
            
            {/* Admin routes - NEW */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} /> {/* Redirect /admin to dashboard */}
            
            {/* Catch all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        {/* Hide AI chat on landlord and admin pages */}
        {!window.location.pathname.startsWith('/landlord') && !window.location.pathname.startsWith('/admin') && <AIChatAgent />}

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