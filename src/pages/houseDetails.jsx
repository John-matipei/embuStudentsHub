import React from "react";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Check,
  Home,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
  Wifi,
  Calendar, // Added Calendar icon
} from "lucide-react";
import {
  Link,
  useParams,
} from "react-router-dom";

export default function HouseDetails({
  houses,
}) {
  const { id } = useParams();

  const house = houses.find(
    (item) => item.id === id
  );

  if (!house) {
    return (
      <section className="section page-section">
        <div className="container empty">
          <h2>House not found</h2>

          <Link
            to="/houses"
            className="btn btn-primary"
          >
            Back to houses
          </Link>
        </div>
      </section>
    );
  }

  const phoneNumber =
    house.phone.replace(/\s/g, "");

  const whatsappNumber =
    "254" +
    house.phone
      .replace(/\D/g, "")
      .replace(/^0/, "");

  return (
    <section className="section page-section">
      <div className="container">

        <Link
          to="/houses"
          className="back-link"
        >
          <ArrowLeft size={17} />
          Back to listings
        </Link>

        <div className="detail-grid">

          <div>

            <div className="detail-image-wrap">

              <img
                src={house.image}
                alt={house.title}
              />

              <span className="status vacant">
                {house.status}
              </span>

            </div>

            <div className="detail-content">

              <span className="eyebrow dark">
                {house.type.toUpperCase()}
              </span>

              <h1>{house.title}</h1>

              <p className="detail-location">
                <MapPin size={17} />

                {house.estate}, Embu County ·
                approximately {house.distance}
                {" "}from the university
              </p>

              <p className="detail-description">
                {house.description}
              </p>

              <div className="detail-features">

                <div>
                  <BedDouble />

                  <span>
                    <strong>
                      {house.rooms}
                    </strong>

                    rooms
                  </span>
                </div>

                <div>
                  <Bath />

                  <span>
                    <strong>
                      {house.bathrooms}
                    </strong>

                    bathroom
                  </span>
                </div>

                <div>
                  <Wifi />

                  <span>
                    <strong>
                      {house.water}
                    </strong>

                    water
                  </span>
                </div>

                <div>
                  <Home />

                  <span>
                    <strong>
                      {house.electricity}
                    </strong>

                    electricity
                  </span>
                </div>

              </div>

              <h2>Amenities</h2>

              <div className="amenities">

                {house.amenities.map(
                  (amenity) => (
                    <span key={amenity}>
                      <Check size={15} />
                      {amenity}
                    </span>
                  )
                )}

              </div>

            </div>
          </div>

          <aside className="contact-card">

            <div className="price-label">
              Monthly rent
            </div>

            <div className="price">
              KSh{" "}
              {Number(
                house.rent
              ).toLocaleString()}
            </div>

            <p>
              Deposit: KSh{" "}
              {Number(
                house.deposit
              ).toLocaleString()}
            </p>

            <hr />

            <div className="landlord-mini">

              <span>
                <UserRound />
              </span>

              <div>
                <small>Listed by</small>
                <strong>
                  {house.landlord}
                </strong>
              </div>

            </div>

            <a
              className="btn btn-primary btn-large full"
              href={`tel:${phoneNumber}`}
            >
              <Phone size={18} />
              Call landlord
            </a>

            <a
              className="btn btn-whatsapp btn-large full"
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp landlord
            </a>

            {/* FIXED: Added Book Viewing Button */}
            <Link
              to={`/booking/${house.id}`}
              className="btn btn-primary btn-large full"
              style={{ marginTop: "10px", background: "#1d7c43" }}
            >
              <Calendar size={18} />
              Book Viewing
            </Link>

            <div className="safety-note">
              <ShieldCheck size={18} />

              <span>
                Always view the property before
                paying a deposit. Never send money
                to an unverified contact.
              </span>
            </div>

          </aside>

        </div>
      </div>
    </section>
  );
}