import React from "react";

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

    if (!process.env.REACT_APP_BACKEND_URL) {
      alert("Backend URL missing in .env");
      return;
    }

    try {
      // CREATE ORDER — ❗ Send amount in RUPEES (no *100)
      const orderRes = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/create-order`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: totalAmount }), // FIXED
        }
      );

      const orderData = await orderRes.json();
      if (!orderData.success) {
        alert("Order creation failed");
        return;
      }

      // SELECT TEST OR LIVE KEY
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
        amount: orderData.amount, // backend returns paise
        currency: "INR",
        name: "SS Fashion",
        description: "Order Payment",
        order_id: orderData.orderId,
        prefill: {
          email: userEmail || "",
          contact: customerPhone || "",
        },
        handler: async (response) => {
          try {
            const verifyRes = await fetch(
              `${process.env.REACT_APP_BACKEND_URL}/verify-payment`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(response),
              }
            );

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              window.dispatchEvent(
                new CustomEvent("payment_success", {
                  detail: {
                    paymentId: response.razorpay_payment_id,
                  },
                })
              );
            } else {
              alert("Payment verification failed!");
            }
          } catch (err) {
            console.error("Verification error:", err);
            alert("Verification failed!");
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
