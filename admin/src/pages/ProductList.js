// admin/src/pages/ProductsAdminPage.js
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import "./ProductList.css";

/**
 * Cloudinary config (keep your existing values)
 */
const CLOUDINARY_CLOUD = "dshnpehlq";
const CLOUDINARY_UNSIGNED_PRESET = "unsigned_homepage_preset";

/* ---------- categories list (same as client) ---------- */
const CATEGORIES = [
  "all",
  "maggam-work",
  "bridal",
  "simple",
  "computer-work",
  "heavy",
  "mirror",
  "thread",
  "simple-buti",
  "new-collection",
  "tops",
  "kidswear",
];

const placeholder = "/placeholder.jpg";

/* ---------- small helper to verify uploaded url actually loads ---------- */
const verifyImageURL = (url, timeout = 2500) =>
  new Promise((resolve) => {
    if (!url) return resolve(false);
    const img = new Image();
    let done = false;
    img.onload = () => {
      if (!done) {
        done = true;
        resolve(true);
      }
    };
    img.onerror = () => {
      if (!done) {
        done = true;
        resolve(false);
      }
    };
    // fallback: if it takes too long we assume ok (network may be slow)
    setTimeout(() => {
      if (!done) {
        done = true;
        resolve(true);
      }
    }, timeout);
    img.src = url;
  });

/* ---------- upload helper with retries ---------- */
async function uploadToCloudinary(file) {
  if (!file) return null;
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UNSIGNED_PRESET);
  // add a simple public id to reduce overwrite chance
  formData.append("public_id", `ssf_${Date.now()}_${Math.floor(Math.random() * 10000)}`);

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { method: "POST", body: formData });
      if (!res.ok) {
        // small delay before retry
        await new Promise((r) => setTimeout(r, 400 * attempt));
        continue;
      }
      const data = await res.json();
      if (!data || !data.secure_url) {
        await new Promise((r) => setTimeout(r, 300 * attempt));
        continue;
      }
      const ok = await verifyImageURL(data.secure_url);
      if (!ok && attempt < 3) {
        await new Promise((r) => setTimeout(r, 400 * attempt));
        continue;
      }
      return data.secure_url;
    } catch (err) {
      if (attempt < 3) await new Promise((r) => setTimeout(r, 400 * attempt));
      else throw new Error("Upload failed: " + err.message);
    }
  }
  throw new Error("Upload failed after retries");
}

/* ---------- Edit modal component (inline) ---------- */
function EditModal({ product, onClose, onSaved }) {
  const [form, setForm] = useState(product || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => setForm(product || null), [product]);

  if (!form) return null;

  const changeField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const addImages = async (files) => {
    if (!files || files.length === 0) return;
    setLoading(true);
    try {
      const arr = Array.from(files);
      const uploaded = [];
      for (const f of arr) {
        const url = await uploadToCloudinary(f);
        uploaded.push(url);
      }
      setForm((p) => ({ ...p, images: [...(p.images || []), ...uploaded], image: (p.images && p.images[0]) || uploaded[0] || p.image }));
    } catch (err) {
      alert("Image upload failed: " + err.message);
    }
    setLoading(false);
  };

  const removeImageAt = (idx) => {
    setForm((p) => {
      const imgs = [...(p.images || [])];
      imgs.splice(idx, 1);
      return { ...p, images: imgs, image: imgs[0] || "" };
    });
  };

  const setPrimary = (idx) => {
    setForm((p) => {
      const imgs = [...(p.images || [])];
      const [picked] = imgs.splice(idx, 1);
      return { ...p, images: [picked, ...imgs], image: picked };
    });
  };

  const save = async () => {
    if (!form.name || !form.price) return alert("Name & Price required");
    setLoading(true);
    try {
      const ref = doc(db, "products", form.id);
      const payload = {
        name: form.name,
        title: form.title || form.name,
        category: form.category || "maggam-work",
        price: Number(form.price),
        original: Number(form.original || form.price),
        stockQty: Number(form.stockQty || 0),
        description: form.description || "",
        images: Array.isArray(form.images) ? form.images : form.images ? [form.images] : [],
        image: (Array.isArray(form.images) && form.images[0]) || form.image || "",
        updatedAt: serverTimestamp(),
      };
      await updateDoc(ref, payload);
      onSaved();
      onClose();
    } catch (err) {
      alert("Save failed: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Edit product</h3>

        <label>Name</label>
        <input value={form.name} onChange={(e) => changeField("name", e.target.value)} />

        <label>Title</label>
        <input value={form.title} onChange={(e) => changeField("title", e.target.value)} />

        <label>Category</label>
        <select value={form.category} onChange={(e) => changeField("category", e.target.value)}>
          {CATEGORIES.filter(c => c !== "all").map(c => <option key={c} value={c}>{c.replace("-", " ")}</option>)}
        </select>

        <label>Price</label>
        <input type="number" value={form.price} onChange={(e) => changeField("price", e.target.value)} />

        <label>Original</label>
        <input type="number" value={form.original || ""} onChange={(e) => changeField("original", e.target.value)} />

        <label>Stock</label>
        <input type="number" value={form.stockQty || 0} onChange={(e) => changeField("stockQty", e.target.value)} />

        <label>Description</label>
        <textarea value={form.description || ""} onChange={(e) => changeField("description", e.target.value)} rows={3} />

        <label>Upload additional images</label>
        <input type="file" accept="image/*" multiple onChange={(e) => addImages(e.target.files)} />

        <div className="edit-thumbs">
          {(form.images || []).map((u, i) => (
            <div key={i} className="edit-thumb">
              <img src={u || placeholder} alt="" />
              <div className="thumb-actions">
                <button onClick={() => setPrimary(i)}>Primary</button>
                <button onClick={() => removeImageAt(i)}>Remove</button>
              </div>
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button onClick={save} disabled={loading}>{loading ? "Saving..." : "Save"}</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- main admin page component ---------- */
export default function ProductsAdminPage() {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState([]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const col = collection(db, "products");
      const q = query(col, orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setProducts(arr);

      // prepare recent list (most recent products)
      const rec = arr.slice(0, 12);
      setRecent(rec);
    } catch (err) {
      console.error(err);
      alert("Failed to load products: " + err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    // (optional) you could add a real-time listener with onSnapshot for live updates
  }, []);

  const openEdit = (p) => setEditing(p);
  const closeEdit = () => setEditing(null);
  const refresh = () => fetchAll();

  const deleteProduct = async (p) => {
    if (!window.confirm(`Delete "${p.name}" permanently? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, "products", p.id));
      setProducts((s) => s.filter(x => x.id !== p.id));
      setRecent((s) => s.filter(x => x.id !== p.id));
      alert("Deleted");
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  const adjustStock = async (p, delta) => {
    try {
      const ref = doc(db, "products", p.id);
      const newStock = Math.max(0, Number(p.stockQty || 0) + delta);
      await updateDoc(ref, { stockQty: newStock, updatedAt: serverTimestamp() });
      refresh();
    } catch (err) {
      alert("Update failed: " + err.message);
    }
  };

  const changeImageForProduct = async (p, file) => {
    if (!file) return;
    try {
      setLoading(true);
      const url = await uploadToCloudinary(file);
      // add as new primary image (or you can push to images list)
      const ref = doc(db, "products", p.id);
      const newImages = [url, ...(p.images || [])];
      await updateDoc(ref, { images: newImages, image: url, updatedAt: serverTimestamp() });
      refresh();
      alert("Image changed");
    } catch (err) {
      alert("Image change failed: " + err.message);
    }
    setLoading(false);
  };

  const visibleProducts = filter === "all" ? products : products.filter(p => p.category === filter);

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <h3>Categories</h3>
        <ul>
          {CATEGORIES.map(c => (
            <li key={c} className={c === filter ? "active" : ""} onClick={() => setFilter(c)}>
              {c === "all" ? "All Products" : c.replace("-", " ")}
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 16 }}>
          <button onClick={refresh} className="refresh-btn">Refresh</button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-top">
          <h2>{filter === "all" ? "All Products" : filter.replace("-", " ").toUpperCase()}</h2>
          <div className="top-controls">
            <span className="count">{visibleProducts.length} items</span>
          </div>
        </header>

        <section className="category-products">
          {loading && <div className="loading">Loading...</div>}
          {!loading && visibleProducts.length === 0 && <div className="empty">No products for this category.</div>}

          <div className="product-grid">
            {visibleProducts.map(p => {
              const primary = p.image || (Array.isArray(p.images) && p.images[0]) || placeholder;
              return (
                <div className="product-card" key={p.id}>
                  <img src={primary} alt={p.name} className="product-primary" />
                  <div className="product-info">
                    <h4>{p.title || p.name}</h4>
                    <div className="price">₹{p.price} <small className="orig">₹{p.original}</small></div>
                    <div className="stock">{p.stockQty > 0 ? `${p.stockQty} in stock` : "Out of stock"}</div>
                    <p className="desc">{p.description && (p.description.length > 120 ? p.description.slice(0, 120) + "..." : p.description)}</p>

                    <div className="thumb-row">
                      {(p.images || []).slice(0, 4).map((u, i) => (
                        <img key={i} src={u} alt={`t-${i}`} className="thumb" />
                      ))}
                    </div>

                    <div className="card-actions">
                      <button onClick={() => adjustStock(p, +1)}>+Stock</button>
                      <button onClick={() => adjustStock(p, -1)}>-Stock</button>
                      <label className="change-img-label">
                        Change Image
                        <input type="file" accept="image/*" onChange={(e) => e.target.files[0] && changeImageForProduct(p, e.target.files[0])} />
                      </label>
                      <button onClick={() => openEdit(p)}>Edit</button>
                      <button className="danger" onClick={() => deleteProduct(p)}>Delete</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="recent-section">
          <h3>Recently Added</h3>
          <div className="recent-grid">
            {recent.map(p => (
              <div key={p.id} className="recent-card">
                <img src={p.image || p.images?.[0] || placeholder} alt={p.name} />
                <div className="recent-info">
                  <div><b>{p.name}</b></div>
                  <div>{p.category} • ₹{p.price}</div>
                  <div className="recent-actions">
                    <button onClick={() => openEdit(p)}>Edit</button>
                    <button onClick={() => deleteProduct(p)} className="danger">Delete</button>
                  </div>
                </div>
              </div>
            ))}
            {recent.length === 0 && <div>No recent uploads</div>}
          </div>
        </section>
      </main>

      {editing && <EditModal product={editing} onClose={closeEdit} onSaved={refresh} />}
    </div>
  );
}
