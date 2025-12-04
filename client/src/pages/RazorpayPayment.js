import React, { useEffect } from "react";

export default function RazorpayPayment({
  totalAmount,
  userEmail,
  customerPhone,
  agreeTerms,
  autoStart = false,
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
      alert("Failed to load Razorpay");
      return;
    }

    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    if (!backendUrl) {
      alert("Backend URL missing");
      return;
    }

    try {
      // ask backend to create order
      const orderRes = await fetch(`${backendUrl}/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: totalAmount }),
      });

      const orderData = await orderRes.json();
      if (!orderData.orderId) {
        alert("Order creation failed.");
        return;
      }

      const amountPaise =
        orderData.amount || Math.round((totalAmount || 0) * 100);

      const razorpayKey = process.env.REACT_APP_RAZORPAY_KEY_ID_TEST;
      if (!razorpayKey) {
        alert("Missing Razorpay Test Key");
        return;
      }

      const options = {
        key: razorpayKey,
        amount: amountPaise,
        currency: "INR",
        name: "SS Fashion",
        description: "Order Payment",
        order_id: orderData.orderId,
        prefill: {
          email: userEmail,
          contact: customerPhone,
        },
        handler: async (response) => {
          const verifyRes = await fetch(`${backendUrl}/verify-payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });

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
            alert("Payment Verification Failed");
          }
        },
        theme: { color: "#E91E63" },
      };

      new window.Razorpay(options).open();
    } catch (err) {
      console.error(err);
      alert("Payment Error");
    }
  };

  // 🔥 AUTO START PAYMENT
  useEffect(() => {
    if (autoStart) startPayment();
  }, [autoStart]);

  return null; // ❌ NO BUTTON SHOWN
}
