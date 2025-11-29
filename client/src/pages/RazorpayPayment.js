import React from "react";
import { db } from "../firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";

const loadRazorpay = () =>
  new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function RazorpayPayment({
  cart,
  form,
  totalAmount,
  userEmail,
  customerPhone,
  agreeTerms
}) {

  // SAVE ORDER TO FIREBASE
  const saveOrderToFirestore = async (paymentId) => {
    try {
      await addDoc(collection(db, "orders"), {
        customerEmail: userEmail,
        customerPhone: customerPhone,
        billingDetails: form,
        items: cart,
        totalPrice: totalAmount,
        paymentId: paymentId,
        status: "paid",
        createdAt: Timestamp.now(),
      });

      alert("Order Saved Successfully!");
      localStorage.removeItem("ssf_cart");  // Clear cart
      window.location.href = "/success";    // Redirect after success

    } catch (error) {
      console.error("Error saving order:", error);
      alert("Error saving order to database");
    }
  };

  // START PAYMENT
  const startPayment = async () => {
    if (!agreeTerms) {
      alert("Please agree to Terms & Conditions.");
      return;
    }

    const ok = await loadRazorpay();
    if (!ok) return alert("Failed to load Razorpay SDK");

    // -----------------------------------------------------
    // 1) CALL BACKEND TO CREATE ORDER
    // -----------------------------------------------------
    const orderRes = await fetch("http://localhost:5000/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: totalAmount }),
    });

    const orderData = await orderRes.json();

    if (!orderData.id) {
      alert("Failed to create order.");
      return;
    }

    // -----------------------------------------------------
    // 2) OPEN RAZORPAY POPUP WITH REAL ORDER ID
    // -----------------------------------------------------
    const options = {
      key: "rzp_test_yourKeyID",
      amount: orderData.amount,
      currency: "INR",
      name: "SS Fashion",
      description: "Online Payment",
      order_id: orderData.id,

      handler: async function (response) {
        const dataToVerify = {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        };

        // -----------------------------------------------------
        // 3) VERIFY PAYMENT WITH SERVER
        // -----------------------------------------------------
        const verifyRes = await fetch("http://localhost:5000/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToVerify),
        });

        const verifyResult = await verifyRes.json();

        if (verifyResult.success) {
        // -----------------------------------------------------
        // 4) SAVE ORDER TO FIREBASE
        // -----------------------------------------------------
          await saveOrderToFirestore(response.razorpay_payment_id);
        } else {
          alert("Payment Failed! Signature mismatch.");
        }
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <button className="place-order-btn" onClick={startPayment}>
      Place Order & Pay
    </button>
  );
}
