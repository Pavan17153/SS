import React from "react";

/**
 * RazorpayPayment
 * Props:
 * - totalAmount (number, rupees)
 * - userEmail
 * - customerPhone
 * - agreeTerms (bool)
 *
 * Note: Backend endpoints expected:
 * POST `${REACT_APP_BACKEND_URL}/create-order` with { amount: <number in rupees> } -> returns { success: true, orderId, amount } (amount in paise recommended)
 * POST `${REACT_APP_BACKEND_URL}/verify-payment` with Razorpay response object -> returns { success: true }
 *
 * Keep your backend implementation consistent with these expectations.
 */
export default function RazorpayPayment({
  totalAmount,
  userEmail,
  customerPhone,
  agreeTerms,
}) {
  const loadRazorpay = () =>
    new Promise((resolve) => {
      if (window.Razorpay) resolve(true);
      else {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      }
    });

  const startPayment = async () => {
    if (!agreeTerms) {
      alert("Please agree to terms & conditions.");
      return;
    }

    const sdkLoaded = await loadRazorpay();
    if (!sdkLoaded) {
      alert("Razorpay SDK failed to load");
      return;
    }

    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    if (!backendUrl) {
      alert("Backend URL missing in .env (REACT_APP_BACKEND_URL)");
      return;
    }

    try {
      // Ask backend to create an order. We send rupees; backend should convert to paise if needed.
      const orderRes = await fetch(`${backendUrl}/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: totalAmount }), // rupees -- backend should handle units
      });

      if (!orderRes.ok) {
        const txt = await orderRes.text();
        console.error("create-order failed:", txt);
        alert("Order creation failed on server.");
        return;
      }

      const orderData = await orderRes.json();

      // Expect backend to return { success: true, orderId, amount } where amount is paise
      if (!orderData || !orderData.orderId) {
        console.error("Unexpected create-order response:", orderData);
        alert("Invalid order response from server.");
        return;
      }

      // Amount: if backend provided amount use it, else fallback to rupees * 100
      const amountForRazor = orderData.amount || Math.round((totalAmount || 0) * 100);

      // Select key (test vs live). Put keys in your .env: REACT_APP_RAZORPAY_KEY_ID_TEST / _LIVE
      const razorpayKey =
        process.env.NODE_ENV === "production"
          ? process.env.REACT_APP_RAZORPAY_KEY_ID_LIVE
          : process.env.REACT_APP_RAZORPAY_KEY_ID_TEST;

      if (!razorpayKey) {
        alert("Razorpay Key missing in .env");
        return;
      }

      const options = {
        key: razorpayKey,
        amount: amountForRazor,
        currency: "INR",
        name: "SS Fashion",
        description: "Order Payment",
        order_id: orderData.orderId,
        prefill: {
          email: userEmail || "",
          contact: customerPhone || "",
        },
        handler: async (response) => {
          // response: { razorpay_payment_id, razorpay_order_id, razorpay_signature }
          try {
            const verifyRes = await fetch(`${backendUrl}/verify-payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });

            if (!verifyRes.ok) {
              const txt = await verifyRes.text();
              console.error("verify-payment failed:", txt);
              alert("Payment verification failed.");
              return;
            }

            const verifyData = await verifyRes.json();
            if (verifyData && verifyData.success) {
              // dispatch event to let Checkout save the order to Firestore
              window.dispatchEvent(
                new CustomEvent("payment_success", {
                  detail: {
                    paymentId: response.razorpay_payment_id,
                    orderId: response.razorpay_order_id,
                  },
                })
              );
            } else {
              console.error("verify-payment returned failure:", verifyData);
              alert("Payment verification failed!");
            }
          } catch (err) {
            console.error("Verification error:", err);
            alert("Verification error, please contact support.");
          }
        },
        theme: { color: "#E91E63" },
      };

      new window.Razorpay(options).open();
    } catch (err) {
      console.error("Payment error:", err);
      alert("Payment failed! Try again.");
    }
  };

  return (
    <button className="pay-btn" onClick={startPayment}>
      Pay Now ₹{totalAmount}
    </button>
  );
}