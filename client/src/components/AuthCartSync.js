import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function AuthCartSync() {
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const uid = user.uid;
      const guestCart = JSON.parse(localStorage.getItem("ssf_cart") || "[]");
      const userRef = doc(db, "carts", uid);
      const snap = await getDoc(userRef);
      const userCart = snap.exists() ? snap.data().items || [] : [];

      const merged = mergeCarts(userCart, guestCart);
      await setDoc(userRef, { items: merged }, { merge: true });

      localStorage.removeItem("ssf_cart");
    });

    return () => unsub();
  }, []);
}

function mergeCarts(userCart, guestCart) {
  const final = [...userCart];
  guestCart.forEach((g) => {
    const f = final.find((u) => u.id === g.id);
    if (f) f.qty += g.qty;
    else final.push(g);
  });
  return final;
}
