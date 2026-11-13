
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { axiosClient } from "../lib/axiosClient";

interface MineralListing {
  _id: string;
  mineralType: string;
  description: string;
  location: string;
  weight: number;
  weightUnit: string;
  price: number;
  currency: string;
  contact: string;
  imageUrls?: string[];
  sellerUsername?: string;
  createdAt?: string;
}

export default function AdminDashboard() {
  const [listings, setListings] = useState<MineralListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadPending = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axiosClient.get("/mineral-listings/pending");
      setListings(
        Array.isArray(response.data?.listings)
          ? response.data.listings
          : []
      );
    } catch (err: any) {
      console.error(err);
      if (err?.response?.status === 403) {
        setError("Huna ruhusa. Admin pekee ndiye anayeruhusiwa.");
      } else if (err?.response?.status === 401) {
        setError("Tafadhali ingia kwa akaunti yako ya Pi.");
      } else {
        setError("Imeshindikana kupakia matangazo. Jaribu tena.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPending();
  }, [loadPending]);

  const reviewListing = async (
    listing: MineralListing,
    status: "approved" | "rejected"
  ) => {
    const action = status === "approved" ? "kuidhinisha" : "kukataa";

    if (!window.confirm(
      `Una uhakika unataka ${action} tangazo la ${listing.mineralType}?`
    )) return;

    setBusyId(listing._id);
    setError("");
    setMessage("");

    try {
      await axiosClient.patch(
        `/mineral-listings/${listing._id}/moderation`,
        { status }
      );

      setListings((current) =>
        current.filter((item) => item._id !== listing._id)
      );

      setMessage(
        status === "approved"
          ? "Tangazo limeidhinishwa na sasa linaweza kuonekana sokoni."
          : "Tangazo limekataliwa."
      );
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.status === 403
          ? "Server imekataa ruhusa ya admin."
          : "Imeshindikana kuhifadhi uamuzi. Jaribu tena."
      );
    } finally {
      setBusyId("");
    }
  };

  const card: React.CSSProperties = {
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
  };

  const button: React.CSSProperties = {
    border: 0,
    borderRadius: 7,
    padding: "11px 17px",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "bold",
  };

  return (
    <main style={{
      maxWidth: 1100,
      margin: "0 auto",
      padding: 20,
      fontFamily: "Arial, sans-serif",
      color: "#202020",
    }}>
      <header style={{
        background: "#172b24",
        color: "#fff",
        padding: 22,
        borderRadius: 12,
        marginBottom: 20,
      }}>
        <h1>GFAMOUS Admin Dashboard</h1>
        <p>Ukaguzi wa matangazo ya madini.</p>
        <Link to="/" style={{ color: "#fff" }}>
          Rudi sokoni
        </Link>
      </header>

      <section style={card}>
        <h2>Matangazo yanayosubiri: {listings.length}</h2>
        <button
          type="button"
          style={{ ...button, background: "#176b43" }}
          onClick={() => void loadPending()}
          disabled={loading}
        >
          {loading ? "Inapakia..." : "Onyesha upya"}
        </button>
      </section>

      {error && (
        <p role="alert" style={{ ...card, color: "#a00000" }}>
          {error}
        </p>
      )}

      {message && (
        <p role="status" style={{ ...card, color: "#176b43" }}>
          {message}
        </p>
      )}

      {loading && <p>Inapakia matangazo...</p>}

      {!loading && !error && listings.length === 0 && (
        <section style={card}>
          Hakuna tangazo linalosubiri ukaguzi kwa sasa.
        </section>
      )}

      {listings.map((listing) => (
        <article key={listing._id} style={card}>
          <h2>{listing.mineralType}</h2>

          {listing.imageUrls?.map((url, index) => (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              key={url + index}
            >
              <img
                src={url}
                alt={`Picha ya ${listing.mineralType}`}
                loading="lazy"
                style={{
                  width: 130,
                  height: 110,
                  objectFit: "cover",
                  borderRadius: 8,
                  margin: 5,
                }}
              />
            </a>
          ))}

          <p>{listing.description}</p>
          <p><strong>Eneo:</strong> {listing.location}</p>
          <p><strong>Uzito:</strong> {listing.weight} {listing.weightUnit}</p>
          <p>
            <strong>Bei:</strong>{" "}
            {Number(listing.price).toLocaleString()} {listing.currency}
          </p>
          <p><strong>Mawasiliano:</strong> {listing.contact}</p>
          <p><strong>Muuzaji:</strong> @{listing.sellerUsername || "Haijatajwa"}</p>

          <div style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginTop: 16,
          }}>
            <button
              type="button"
              style={{ ...button, background: "#176b43" }}
              onClick={() => void reviewListing(listing, "approved")}
              disabled={busyId === listing._id}
            >
              {busyId === listing._id ? "Inahifadhi..." : "Idhinisha"}
            </button>

            <button
              type="button"
              style={{ ...button, background: "#9b2929" }}
              onClick={() => void reviewListing(listing, "rejected")}
              disabled={busyId === listing._id}
            >
              {busyId === listing._id ? "Inahifadhi..." : "Kataa"}
            </button>
          </div>
        </article>
      ))}
    </main>
  );
}
