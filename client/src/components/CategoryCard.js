export default function CategoryCard({ category, onSelect }) {
  return (
    <div
      className="border rounded shadow-sm p-2 text-center"
      style={{ cursor: "pointer" }}
      onClick={onSelect}
    >
      <img
        src={category.image}
        className="img-fluid rounded"
        style={{ height: 120, objectFit: "cover" }}
        alt={category.label}
      />
      <h6 className="mt-2">{category.label}</h6>
    </div>
  );
}
