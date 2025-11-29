import { Link } from "react-router-dom";

export default function ProductCard({ p }) {
  return (
    <div className="card shadow-sm card-hover">
      <img
        src={p.image}
        className="card-img-top"
        style={{ height: 180, objectFit: "cover" }}
        alt={p.name}
      />
      <div className="card-body text-center">
        <h6>{p.name}</h6>
        <p>
          <span style={{ textDecoration: "line-through" }}>₹{p.original}</span>{" "}
          <span className="text-danger fw-bold">₹{p.price}</span>
        </p>

        <Link
          to={`/product/${p.id}`}
          className="btn btn-sm btn-outline-primary"
        >
          View
        </Link>
      </div>
    </div>
  );
}
