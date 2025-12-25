// src/pages/Checkout.js 
import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import {
  collection,
  addDoc,
  Timestamp,
  doc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  runTransaction,
} from "firebase/firestore";
import RazorpayPayment from "./RazorpayPayment";
import EmailExistPopup from "./EmailExistPopup";
import LoginPopup from "./LoginPopup";
import "../Checkout.css";
import "./PopupStyles.css";
import { getNextInvoiceNumber } from "./getNextInvoiceNumber";
import { getNextOrderId } from "./getNextOrderId";
import { sendOrderStatusEmail } from "./notify";
const INDIA_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu & Kashmir", "Ladakh", "Puducherry"
];

function generateRandomPassword(length = 12) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
  let pw = "";
  for (let i = 0; i < length; i++) {
    pw += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pw;
}


export default function Checkout() {
  const [userEmail, setUserEmail] = useState("");

  const loadCorrectCart = () => {
    const email = auth.currentUser?.email;
    const key = email ? `ssf_cart_${email}` : "ssf_cart";
    return JSON.parse(localStorage.getItem(key) || "[]");
  };

  const [cart, setCart] = useState(loadCorrectCart());
  const [appliedCoupon, setAppliedCoupon] = useState(null); // ✅ new state

  useEffect(() => {
    // load persisted applied coupon from localStorage (set by FetchCoupons)
    try {
      const storedCoupon = localStorage.getItem("ssf_appliedCoupon");
      if (storedCoupon) setAppliedCoupon(JSON.parse(storedCoupon));
      // also allow window.appliedCouponObj fallback
      else if (window.appliedCouponObj) setAppliedCoupon(window.appliedCouponObj);
    } catch (e) {
      console.warn("Could not read applied coupon from localStorage", e);
    }
  }, []);

  // useEffect(() => {
  //   const unsub = onAuthStateChanged(auth, () => {
  //     setCart(loadCorrectCart());
  //   });
  //   return () => unsub();
  // }, []);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    company: "",
    country: "India",
    address1: "",
    address2: "",
    city: "",
    state: "",
    pin: "",
    phone: "",
    email: "",
    orderNotes: "",
  });

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [createAccount, setCreateAccount] = useState(false);
  const [stateSuggestions, setStateSuggestions] = useState([]);
  const [loadingSave, setLoadingSave] = useState(false);
  const [payInitiated, setPayInitiated] = useState(false);


  const [emailExistPopupVisible, setEmailExistPopupVisible] = useState(false);
  const [loginPopupVisible, setLoginPopupVisible] = useState(false);
  const [loginPrefillEmail, setLoginPrefillEmail] = useState("");
  const [infoMessage, setInfoMessage] = useState(null);
  const [proceedToPayment, setProceedToPayment] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [accountCreatedEmail, setAccountCreatedEmail] = useState("");

  const total = cart.reduce((s, i) => s + i.price * (i.qty || 1), 0);

  let shipping = 0;
  if (cart.length > 0) {
    if (total >= 1500) shipping = 0; // Free shipping for orders 1500+
    else shipping = 40;              // Flat rate 30 for smaller orders
  }

  const discount = appliedCoupon ? appliedCoupon.amount : 0; // ✅ apply coupon
  const grandTotal = Math.max(total + shipping - discount, 0); // ✅ total after discount

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
        setForm((prev) => ({ ...prev, email: user.email }));
        setCart(loadCorrectCart());
      } else {
        setUserEmail("");
        setCart(loadCorrectCart());
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = (form.state || "").trim().toLowerCase();
    if (!q) return setStateSuggestions([]);
    const matched = INDIA_STATES.filter((s) =>
      s.toLowerCase().startsWith(q)
    ).slice(0, 8);
    setStateSuggestions(matched);
  }, [form.state]);

  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const required = [
      "firstName",
      "lastName",
      "address1",
      "address2",
      "city",
      "state",
      "pin",
      "phone",
      "email",
    ];
    for (const key of required) {
      if (!form[key] || String(form[key]).trim() === "") {
        return { ok: false, field: key };
      }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return { ok: false, field: "email" };
    if (!/^\d{7,15}$/.test(form.phone.replace(/\D/g, "")))
      return { ok: false, field: "phone" };
    if (!agreeTerms) return { ok: false, field: "agreeTerms" };
    if (!cart || cart.length === 0) return { ok: false, field: "cart" };
    return { ok: true };
  };

  useEffect(() => {
    if (!infoMessage) return;
    const timer = setTimeout(() => setInfoMessage(null), 7000);
    return () => clearTimeout(timer);
  }, [infoMessage]);
  const checkEmailOnBlur = async () => {
    const email = form.email.trim().toLowerCase();
    if (!email) return;

    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (
        methods.length > 0 &&
        !auth.currentUser &&
        !emailExistPopupVisible &&
        !loginPopupVisible
      ) {
        setLoginPrefillEmail(email);
        setEmailExistPopupVisible(true);
      }
    } catch (err) {
      console.warn("Email check failed:", err);
    }
  };
  const resetPaymentState = (message = null) => {
    setPayInitiated(false);
    setProceedToPayment(false);
    setCheckingEmail(false);

    if (message) {
      setInfoMessage({
        type: "error",
        text: message,
      });
    }
  };
  // ✅ CHECK & LOCK STOCK BEFORE PAYMENT
  // 🔒 CHECK & LOCK STOCK (AMAZON STYLE)
  const checkAndLockStock = async () => {
    const LOCK_TIME_MS = 5 * 60 * 1000; // 5 minutes

    await runTransaction(db, async (tx) => {
      const now = Date.now();

      for (const item of cart) {
        const pid = item.productId || item.id;
        if (!pid) throw new Error("Invalid product");

        const ref = doc(db, "products", pid);
        const snap = await tx.get(ref);
        if (!snap.exists()) {
          throw new Error(`${item.name} not found`);
        }

        const data = snap.data();
        const stockQty = data.stockQty || 0;
        const lockedQty = data.lockedQty || 0;
        const lockUntil = data.lockUntil?.toMillis?.() || 0;

        // Auto-unlock expired locks
        const effectiveLocked =
          lockUntil && lockUntil >= now ? lockedQty : 0;

        const available = stockQty - effectiveLocked;
        const qty = item.qty || 1;

        if (available < qty) {
          throw new Error(`${item.name} is out of stock`);
        }

        tx.update(ref, {
          lockedQty: effectiveLocked + qty,
          lockUntil:
            effectiveLocked + qty > 0
              ? Timestamp.fromMillis(now + LOCK_TIME_MS)
              : null,
        });

      }
    });
  };

  const handlePayNowClicked = async () => {
    for (const item of cart) {
      if (!item.productId && !item.id) {
        setInfoMessage({
          type: "error",
          text: "Invalid product in cart. Please refresh.",
        });
        return;
      }
      if (!item.qty || item.qty <= 0) {
        setInfoMessage({
          type: "error",
          text: "Invalid quantity detected.",
        });
        return;
      }
    }
    if (payInitiated || checkingEmail) return;
    setInfoMessage(null);
    const v = validate();
    if (!v.ok) {
      if (v.field === "agreeTerms")
        setInfoMessage({
          type: "error",
          text: "Please accept terms & conditions.",
        });
      else if (v.field === "cart")
        setInfoMessage({ type: "error", text: "Your cart is empty." });
      else
        setInfoMessage({
          type: "error",
          text: `Please fill required field: ${v.field}`,
        });

      return;
    }

    const email = form.email.trim().toLowerCase();
    if (!email)
      return setInfoMessage({
        type: "error",
        text: "Please provide a valid email.",
      });

    const currentUser = auth.currentUser;
    if (currentUser && currentUser.email.toLowerCase() === email) {
      try {
        // 🔒 CHECK STOCK BEFORE PAYMENT
        await checkAndLockStock();

        setPayInitiated(true);
        setInfoMessage({
          type: "info",
          text: "Opening secure payment...",
        });
        setProceedToPayment(true);
        return;

      } catch (err) {
        setInfoMessage({
          type: "error",
          text: err.message || "Some items are out of stock",
        });
        return;
      }

    }

    setCheckingEmail(true);

    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods && methods.length > 0 && !emailExistPopupVisible) {
        setLoginPrefillEmail(email);
        setEmailExistPopupVisible(true);
        setCheckingEmail(false);
        return;
      }

      const randomPw = generateRandomPassword(12);
      try {
        // createUserWithEmailAndPassword signs-in the user on success
        await createUserWithEmailAndPassword(auth, email, randomPw);
        setAccountCreatedEmail(email);
      } catch {
        try {
          await signInWithEmailAndPassword(auth, email, randomPw);
        } catch {
          setLoginPrefillEmail(email);
          setLoginPopupVisible(true);
          setCheckingEmail(false);
          return;
        }
      }

      try {
        await sendPasswordResetEmail(auth, email);
      } catch { }
      setPayInitiated(true);
      setInfoMessage({
        type: "info",
        text: "Opening secure payment...",
      });
      setProceedToPayment(true);
      setCheckingEmail(false);
    } catch (err) {
      setInfoMessage({
        type: "error",
        text: "Error checking email registration. Try again.",
      });
      setCheckingEmail(false);
    }
  };

  // Wait for auth.currentUser for up to `timeout` milliseconds
  const waitForAuth = (timeout = 5000) =>
    new Promise((resolve) => {
      if (auth.currentUser) return resolve(auth.currentUser);

      let waited = 0;
      const iv = setInterval(() => {
        if (!document.body) {
          clearInterval(iv);
          return resolve(null);
        }

        if (auth.currentUser) {
          clearInterval(iv);
          resolve(auth.currentUser);
        }

        waited += 200;
        if (waited >= timeout) {
          clearInterval(iv);
          resolve(null);
        }
      }, 200);
    });


  // ✅ DEDUCT STOCK AFTER PAYMENT (NO CHECK)
  const reduceStockInFirestore = async () => {
    await runTransaction(db, async (tx) => {
      const now = Date.now();

      for (const item of cart) {
        const pid = item.productId || item.id;
        if (!pid) throw new Error("Invalid product");

        const qty = item.qty || 1;
        const ref = doc(db, "products", pid);
        const snap = await tx.get(ref);
        if (!snap.exists()) throw new Error("Product not found");

        const data = snap.data();
        const stockQty = data.stockQty || 0;
        const lockedQty = data.lockedQty || 0;
        const lockUntil = data.lockUntil?.toMillis?.() || 0;

        // 🔒 CRITICAL VALIDATION
        if (lockUntil < now) {
          throw new Error(`${item.name} lock expired. Please try again.`);
        }

        if (lockedQty < qty) {
          throw new Error(`${item.name} stock was not reserved correctly.`);
        }

        tx.update(ref, {
          stockQty: stockQty - qty,
          lockedQty: lockedQty - qty,
          lockUntil: lockedQty - qty === 0 ? null : data.lockUntil,
        });
      }
    });
  };




  // 🔓 UNLOCK STOCK (payment cancelled / tab closed)
  const unlockStock = async () => {
    await runTransaction(db, async (tx) => {
      for (const item of cart) {
        const pid = item.productId || item.id;
        if (!pid) continue;

        const ref = doc(db, "products", pid);
        const snap = await tx.get(ref);
        if (!snap.exists()) continue;

        const lockedQty = snap.data().lockedQty || 0;
        const qty = item.qty || 1;

        const newLocked = Math.max(lockedQty - qty, 0);
        tx.update(ref, {
          lockedQty: newLocked,
          lockUntil: newLocked === 0 ? null : snap.data().lockUntil,
        });

      }
    });
  };


  useEffect(() => {
    const handler = async (e) => {
      const paymentId = e.detail?.paymentId;
      if (!paymentId) return;

      setLoadingSave(true);

      try {
        const orderEmail = form.email.trim().toLowerCase();

        // Wait short time for auth to stabilize (important after newly-created users)
        const currentUser = await waitForAuth(5000);

        if (!currentUser || currentUser.email.toLowerCase() !== orderEmail) {
          setInfoMessage({
            type: "error",
            text:
              "Session expired or not signed in. Please refresh, login and try again.",
          });
          setLoadingSave(false);
          return;
        }

        // ⭐⭐⭐ REDUCE STOCK BEFORE SAVING ORDER ⭐⭐⭐
        try {
          await reduceStockInFirestore();
        } catch (err) {
          console.error("reduceStockInFirestore error:", err);
          // If permission denied for product updates, surface a helpful message
          if (err?.code === "permission-denied") {
            setInfoMessage({
              type: "error",
              text:
                "Unable to update product stock due to permissions. Contact admin.",
            });
            setLoadingSave(false);
            return;
          }
          throw err;
        }

        // Save order (returns orderId)
        let orderId;
        try {
          const savedOrder = await saveOrderToFirestore(orderEmail, paymentId);
          orderId = savedOrder.orderId; // SSF-0012
          await sendOrderStatusEmail({
            email: form.email,
            orderId,
            paymentId,
            amount: grandTotal,
            name: `${form.firstName} ${form.lastName}`,
            shippingAddress: {
              address1: form.address1,
              address2: form.address2,
              city: form.city,
              state: form.state,
              pin: form.pin,
              phone: form.phone,
            },
            items: cart.map((item) => ({
              name: item.name,
              qty: item.qty || 1,
              price: item.price,
            })),
            statusType: "Placed",
          });
          await addDoc(collection(db, "adminNotifications"), {
            title: "New Order Received",
            message: `Order placed by ${orderEmail}`,
            read: false,
            createdAt: Timestamp.now(),
          });

        } catch (err) {
          console.error("saveOrderToFirestore error:", err);
          if (err?.code === "permission-denied") {
            setInfoMessage({
              type: "error",
              text:
                "Unable to save order due to permissions. Contact admin.",
            });
            setLoadingSave(false);
            return;
          }
          throw err;
        }

        // Save coupon usage (if any)
        try {
          await saveCouponUsedData(orderId, paymentId);
        } catch (err) {
          console.error("saveCouponUsedData error:", err);
          if (err?.code === "permission-denied") {
            setInfoMessage({
              type: "error",
              text:
                "Could not log coupon usage due to permissions. Contact admin.",
            });
            // proceed — coupon logging failing shouldn't block order success UI
          } else {
            // non-permission errors also shouldn't block final flow, log & continue
            console.warn("coupon logging failed:", err);
          }
        }

        const email = auth.currentUser?.email;
        if (email) {
          localStorage.removeItem(`ssf_cart_${email}`);
        } else {
          localStorage.removeItem("ssf_cart");
        }
        setCart([]);
        localStorage.removeItem("ssf_appliedCoupon"); // remove applied coupon
        setAppliedCoupon(null);

        if (accountCreatedEmail) {
          setInfoMessage({
            type: "success",
            text: `Account created for email: ${accountCreatedEmail}. Please check your inbox (and spam folder) to reset your password.`,
          });
          setAccountCreatedEmail("");
          setTimeout(() => (window.location.href = "/orders"), 7000);
        } else {
          setInfoMessage({
            type: "success",
            text: "Order saved! Redirecting…",
          });
          setTimeout(() => (window.location.href = "/orders"), 900);
        }
      } catch (err) {
        console.error("Stock/Order Error:", err);
        // show friendly message for unknown failures
        setInfoMessage({
          type: "error",
          text:
            err?.message ||
            "Could not save order due to an unexpected error. Check console.",
        });
      } finally {
        setLoadingSave(false);
      }
    };

    window.addEventListener("payment_success", handler);
    return () => window.removeEventListener("payment_success", handler);
  }, [form, cart, accountCreatedEmail, appliedCoupon]);
  useEffect(() => {

    const handlePaymentCancelled = async () => {
      await unlockStock();
      resetPaymentState("Payment was cancelled. You can try again.");
    };


    window.addEventListener("payment_cancelled", handlePaymentCancelled);
    return () =>
      window.removeEventListener("payment_cancelled", handlePaymentCancelled);
  }, []);


  // ============================
  // saveCouponUsedData (atomic, prevents double-use & race)
  // ============================
  const saveCouponUsedData = async (orderId, paymentId) => {
    if (!appliedCoupon) return; // coupon not applied, skip

    // guard: ensure auth present before write (security rules require auth)
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated for coupon logging.");
    }

    const couponRef = doc(db, "coupons", appliedCoupon.id);
    // use deterministic per-user couponUsed doc id to avoid duplicates
    const couponUsedId = `${appliedCoupon.id}_${currentUser.uid}`;
    const couponUsedRef = doc(db, "couponUsed", couponUsedId);

    // transaction: ensure coupon is active, user hasn't already used, update usedCount atomically
    try {
      await runTransaction(db, async (tx) => {
        const cSnap = await tx.get(couponRef);
        if (!cSnap.exists()) {
          throw new Error("Coupon no longer exists.");
        }
        const cData = cSnap.data();
        const maxUsers = cData.maxUsers ?? null;
        const usedCount = cData.usedCount || 0;
        const isActive = cData.active !== false;

        if (!isActive) {
          throw new Error("Coupon is not active.");
        }
        if (maxUsers !== null && usedCount >= maxUsers) {
          // deactivate if reached (best-effort)
          tx.update(couponRef, { active: false });
          throw new Error("Coupon usage limit reached.");
        }

        // check if user already used this coupon (by reading couponUsedRef)
        const usedSnap = await tx.get(couponUsedRef);
        if (usedSnap.exists()) {
          throw new Error("You have already used this coupon.");
        }

        const itemNames = cart.map(i => `${i.name} x ${i.qty || 1}`).join(", ");

        // create couponUsed doc with deterministic id (so repeated attempts fail)
        tx.set(couponUsedRef, {
          orderId,
          paymentId,
          totalAmount: grandTotal,
          item: itemNames,
          couponName: appliedCoupon.name,
          couponId: appliedCoupon.id,
          discount: appliedCoupon.amount,
          createdAt: Timestamp.now(),
          usedBy: currentUser.email,
          uid: currentUser.uid,
        });

        // increment usedCount and deactivate if reached
        const newUsed = usedCount + 1;
        const updates = { usedCount: newUsed };
        if (maxUsers !== null && newUsed >= maxUsers) updates.active = false;
        tx.update(couponRef, updates);
      });
    } catch (err) {
      // bubble up for caller to handle friendly messages
      throw err;
    }
  };

  const saveOrderToFirestore = async (orderEmail, paymentId) => {
    // guard: ensure auth present before write (rules require authenticated user)
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.email.toLowerCase() !== orderEmail) {
      // throw a clear error so caller shows helpful message
      const e = new Error("Not authenticated as the order email user.");
      e.code = "not-authenticated";
      throw e;
    }


    const itemsForDb = await Promise.all(
      cart.map(async (item) => {
        let category = item.category || "";
        let subCategory = item.subCategory || "";

        // 🔒 SAFETY NET: fetch from products if missing
        if ((!category || !subCategory) && (item.productId || item.id)) {
          try {
            const pid = item.productId || item.id;
            const snap = await getDoc(doc(db, "products", pid));
            if (snap.exists()) {
              const p = snap.data();
              category = category || p.category || "";
              subCategory = subCategory || p.subCategory || "";
            }
          } catch (e) {
            console.warn("Category fetch fallback failed", e);
          }
        }

        return {
          name: item.name,
          price: item.price,
          qty: item.qty || 1,
          image: item.image || "",
          category,          // ✅ GUARANTEED
          subCategory,       // ✅ GUARANTEED
          productId: item.productId || item.id || "",
          orderNotes: item.orderNotes || "",
        };
      })
    );
    // 🔢 Generate invoice number (atomic & safe)
    const orderId = await getNextOrderId();
    const invoiceNo = await getNextInvoiceNumber();


    const ref = await addDoc(collection(db, "orders"), {
      orderId,
      invoiceNo,
      customerEmail: orderEmail,
      customerPhone: form.phone,
      billingDetails: { ...form },
      Note: form.orderNotes,
      items: itemsForDb,
      totalPrice: grandTotal, // ✅ discounted total
      couponApplied: appliedCoupon || null, // ✅ save coupon info
      paymentId,
      status: "pending",
      createdAt: Timestamp.now(),
      createdBy: currentUser.email,
    });
    return { docId: ref.id, orderId };
  };

  const openLoginFromExistPopup = (email) => {
    setEmailExistPopupVisible(false);
    setLoginPrefillEmail(email);
    setTimeout(() => setLoginPopupVisible(true), 80);
  };

  // make this async so we can re-validate coupon immediately after login
  const handleLoginSuccess = async () => {
    setLoginPopupVisible(false);
    setCart(loadCorrectCart());
    setInfoMessage({
      type: "success",
      text: "Logged in. Click Pay Now again.",
    });

    // re-validate coupon for the newly-logged-in user so coupon can't be reused
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        await validateCouponForCurrentUser(currentUser);
      } catch (err) {
        // validator already sets friendly messages; just log
        console.warn("Coupon validation after login failed:", err);
      }
    }
  };

  // ==========================
  // NEW: validateCouponForCurrentUser
  // Ensures coupon applied in localStorage/cart is still valid for the logged in user.
  // If invalid (already used, deactivated, or maxUsers reached), remove it and notify user.
  // ==========================
  const validateCouponForCurrentUser = async (currentUser) => {
    if (!appliedCoupon) return;
    if (!currentUser) return;

    try {
      const couponRef = doc(db, "coupons", appliedCoupon.id);
      const couponUsedId = `${appliedCoupon.id}_${currentUser.uid}`;
      const couponUsedRef = doc(db, "couponUsed", couponUsedId);

      const [cSnap, usedSnap] = await Promise.all([
        getDoc(couponRef),
        getDoc(couponUsedRef),
      ]);

      // If user already used the coupon -> remove it
      if (usedSnap.exists()) {
        localStorage.removeItem("ssf_appliedCoupon");
        setAppliedCoupon(null);
        setInfoMessage({
          type: "error",
          text:
            "The coupon you had applied was already used by this account, so it has been removed.",
        });
        return;
      }

      // If coupon doc doesn't exist or is inactive or usage limit reached -> remove it
      if (!cSnap.exists()) {
        localStorage.removeItem("ssf_appliedCoupon");
        setAppliedCoupon(null);
        setInfoMessage({
          type: "error",
          text: "The coupon you had applied is no longer valid and has been removed.",
        });
        return;
      }

      const cData = cSnap.data();
      const isActive = cData.active !== false;
      const maxUsers = cData.maxUsers ?? null;
      const usedCount = cData.usedCount || 0;

      if (!isActive || (maxUsers !== null && usedCount >= maxUsers)) {
        localStorage.removeItem("ssf_appliedCoupon");
        setAppliedCoupon(null);
        setInfoMessage({
          type: "error",
          text:
            "The coupon you had applied is no longer available and has been removed.",
        });
        return;
      }

      // otherwise coupon still valid for this user — do nothing
    } catch (err) {
      console.error("validateCouponForCurrentUser error:", err);
      // don't block the user — if validation fails due to network etc. we leave coupon as-is.
      // but inform admin-friendly message optionally:
      // setInfoMessage({ type: 'error', text: 'Could not validate coupon at login — please try again.' })
    }
  };

  // When user logs-in or appliedCoupon changes, re-validate coupon for the current user
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!appliedCoupon || !currentUser) return;
    // fire-and-forget validation
    validateCouponForCurrentUser(currentUser).catch((err) =>
      console.warn("Coupon validation error:", err)
    );
  }, [appliedCoupon, userEmail]);

  return (
    <>
      <div style={{ maxWidth: 1150, margin: "10px auto" }}>
        {infoMessage && (
          <div className={`popup-msg ${infoMessage.type}`}>
            {infoMessage.type === "info" ? (
              <span className="loading-dots">{infoMessage.text}</span>
            ) : (
              infoMessage.text
            )}
          </div>
        )}

      </div>

      <div
        className="checkout-grid"
        style={{ maxWidth: 1150, margin: "18px auto 40px" }}
      >
        {/* LEFT */}
        <div className="checkout-left">
          <h2>Billing Details</h2>

          {userEmail ? (
            <p className="small-muted">Logged in as: {userEmail}</p>
          ) : (
            <p className="small-muted">
              Returning customer? <a href="/login">Click here to login</a>
            </p>
          )}

          <div className="billing-form">
            <div className="form-row">
              <input
                type="text"
                name="firstName"
                placeholder="First name *"
                value={form.firstName}
                onChange={handleInput}
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last name *"
                value={form.lastName}
                onChange={handleInput}
              />
            </div>

            <input
              type="text"
              name="company"
              placeholder="Company name (optional)"
              value={form.company}
              onChange={handleInput}
            />
            <input
              type="text"
              name="country"
              placeholder="Country *"
              value={form.country}
              onChange={handleInput}
            />
            <input
              type="text"
              name="address1"
              placeholder="Street address *"
              value={form.address1}
              onChange={handleInput}
            />
            <input
              type="text"
              name="address2"
              placeholder="Apartment, suite (optional) *"
              value={form.address2}
              onChange={handleInput}
            />

            <div className="form-row">
              <input
                type="text"
                name="city"
                placeholder="City *"
                value={form.city}
                onChange={handleInput}
              />
              <div style={{ position: "relative", flex: 1 }}>
                <input
                  type="text"
                  name="state"
                  placeholder="State *"
                  value={form.state}
                  onChange={handleInput}
                  autoComplete="off"
                />
                {stateSuggestions.length > 0 && (
                  <div className="state-suggestions">
                    {stateSuggestions.map((s, idx) => (
                      <div
                        key={idx}
                        className="state-suggestion-item"
                        onClick={() =>
                          setForm((prev) => ({ ...prev, state: s }))
                        }
                      >
                        {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-row">
              <input
                type="text"
                name="pin"
                placeholder="PIN Code *"
                value={form.pin}
                onChange={handleInput}
              />
              <input
                type="text"
                name="phone"
                placeholder="Phone *"
                value={form.phone}
                onChange={handleInput}
              />
            </div>

            <input
              type="email"
              name="email"
              placeholder="Email address *"
              value={form.email}
              onChange={handleInput}
              onBlur={checkEmailOnBlur}
            />

            <textarea
              name="orderNotes"
              placeholder="Order notes (optional)"
              value={form.orderNotes}
              onChange={handleInput}
            />

            {!userEmail && (
              <p style={{ fontSize: 13, color: "#444", marginTop: 6 }}>
                If you don't create an account explicitly we may create one
                silently to save this order.
              </p>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className="checkout-right">
          <h3>Your Order</h3>

          <div className="order-summary">
            {cart.map((item, idx) => (
              <div className="order-item" key={idx}>
                <span>
                  {item.name} × {item.qty || 1}
                </span>
                <span>₹{item.price * (item.qty || 1)}</span>
              </div>
            ))}

            <hr />
            <div className="order-total-row">
              <span>Subtotal</span>
              <span>₹{total}</span>
            </div>
            <div className={`summary-row ${shipping === 0 ? "free-shipping" : "flat-shipping"}`}>
              <span>Shipping</span>
              <strong>{shipping === 0 ? "Free" : `₹${shipping}`}</strong>
            </div>
            {appliedCoupon && (
              <div className="order-total-row">
                <span>Coupon ({appliedCoupon.name})</span>
                <span>-₹{appliedCoupon.amount}</span>
              </div>
            )}
            <div className="order-total-row total">
              <strong>Total</strong>
              <strong>₹{grandTotal}</strong>
            </div>

            <div className="terms order-terms">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={() => setAgreeTerms(!agreeTerms)}
              />
              <label>I have read and agree to the website terms & conditions *</label>
            </div>

            <button
              className="place-order-btn"
              onClick={handlePayNowClicked}
              disabled={checkingEmail || loadingSave || payInitiated}
              style={{ marginTop: 12 }}
            >
              {payInitiated
                ? "Redirecting..."
                : checkingEmail
                  ? "Checking..."
                  : "Pay Now"}

            </button>

            <div style={{ marginTop: 10 }}>
              {proceedToPayment && (
                <RazorpayPayment
                  cart={cart}
                  form={form}
                  totalAmount={grandTotal}
                  userEmail={userEmail || form.email}
                  customerPhone={form.phone}
                  agreeTerms={agreeTerms}
                  autoStart={true}
                  setInfoMessage={setInfoMessage}
                />
              )}
            </div>

            {loadingSave && (
              <p style={{ color: "#ff6b81", marginTop: 8 }}>
                Processing order, please wait...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* POPUPS */}
      <EmailExistPopup
        visible={emailExistPopupVisible}
        email={loginPrefillEmail}
        onClose={() => setEmailExistPopupVisible(false)}
        onOpenLogin={openLoginFromExistPopup}
      />

      <LoginPopup
        visible={loginPopupVisible}
        onClose={() => setLoginPopupVisible(false)}
        prefillEmail={loginPrefillEmail}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
}
