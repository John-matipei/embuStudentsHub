import React, { useState } from "react";
import {
  Building2,
  Menu,
  X,
  Search,
  UserRound,
  Users
} from "lucide-react";
import {
  Link,
  useLocation,
} from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const closeMenu = () => setOpen(false);

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <Link
          to="/"
          className="brand"
          onClick={closeMenu}
        >
          <span className="brand-icon">
            <Building2 size={21} />
          </span>
          <span>
            Embu
            <strong>Student Homes</strong>
          </span>
        </Link>

        <nav
          className={
            open
              ? "nav-links open"
              : "nav-links"
          }
        >
          <Link
            to="/"
            className={
              location.pathname === "/"
                ? "active"
                : ""
            }
            onClick={closeMenu}
          >
            Home
          </Link>

          <Link
            to="/houses"
            className={
              location.pathname.startsWith(
                "/houses"
              )
                ? "active"
                : ""
            }
            onClick={closeMenu}
          >
            Find a house
          </Link>

          <Link
            to="/landlord/login"
            className={
              location.pathname.startsWith(
                "/landlord"
              )
                ? "active"
                : ""
            }
            onClick={closeMenu}
          >
            Landlords
          </Link>

          <div className="mobile-nav-action">
            <Link
              to="/houses"
              className="btn btn-primary"
              onClick={closeMenu}
            >
              <Search size={17} />
              Find a home
            </Link>
          </div>

        </nav>

        <div className="nav-actions">
          <Link
            to="/landlord/login"
            className="nav-login"
          >
            <UserRound size={17} />
            Landlord login
          </Link>

          <Link
            to="/houses"
            className="btn btn-primary nav-cta"
          >
            Find a home
          </Link>
        </div>

        <button
          className="menu-button"
          onClick={() =>
            setOpen(!open)
          }
          aria-label="Menu"
        >
          {open ? (
            <X />
          ) : (
            <Menu />
          )}
        </button>

      </div>
    </header>
  );
}