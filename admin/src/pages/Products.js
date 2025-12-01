// admin/src/pages/Products.js
import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";

export default function Products(){
  const [items, setItems] = useState([]);
  const [name, setName] = useState(""); const [price, setPrice] = useState(""); const [category, setCategory] = useState(""); const [image, setImage] = useState("");

  const fetchItems = async ()=> {
    const snap = await getDocs(collection(db, "products"));
    setItems(snap.docs.map(d=>({ id:d.id, ...d.data() })));
  };

  useEffect(()=>{ fetchItems(); },[]);

  const add = async ()=> {
    if(!name) return alert("Add name");
    await addDoc(collection(db,"products"), { name, price: Number(price||0), image: image||"/saree.jpg", category: category||"sarees", views:0, createdAt: new Date() });
    setName(""); setPrice(""); setImage(""); setCategory(""); fetchItems();
  };

  const remove = async (id)=> { if(!confirm("Delete?")) return; await deleteDoc(doc(db,"products",id)); fetchItems(); };
  const incViews = async (id) => { const ref = doc(db,"products",id); await updateDoc(ref,{ views: 1 }); fetchItems(); };

  return (
    <div>
      <h3>Products</h3>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
        <input placeholder="name" value={name} onChange={e=>setName(e.target.value)} />
        <input placeholder="price" value={price} onChange={e=>setPrice(e.target.value)} />
        <input placeholder="category" value={category} onChange={e=>setCategory(e.target.value)} />
        <input placeholder="image url" value={image} onChange={e=>setImage(e.target.value)} />
        <button onClick={add}>Add</button>
      </div>
      <table border="1" cellPadding="6">
        <thead><tr><th>Name</th><th>Price</th><th>Category</th><th>Image</th><th>Views</th><th>Action</th></tr></thead>
        <tbody>{items.map(i=> <tr key={i.id}><td>{i.name}</td><td>₹{i.price}</td><td>{i.category}</td><td><img src={i.image || (i.images && i.images[0]) || "/placeholder.jpg"} className="admin-thumb" alt={i.name}/></td><td>{i.views||0}</td><td><button onClick={()=>remove(i.id)}>Delete</button></td></tr>)}</tbody>
      </table>
    </div>
  );
}
