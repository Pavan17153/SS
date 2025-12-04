require("dotenv").config();
const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

// Detect Mode
const isLive = process.env.NODE_ENV === "production";

// Load Keys
const key_id = isLive
  ? process.env.RAZORPAY_KEY_ID_LIVE
  : process.env.RAZORPAY_KEY_ID_TEST;

const key_secret = isLive
  ? process.env.RAZORPAY_KEY_SECRET_LIVE
  : process.env.RAZORPAY_KEY_SECRET_TEST;

console.log(`Environment Mode: ${isLive ? "LIVE" : "TEST"}`);
console.log(`Using Key ID: ${key_id}`);

// Check Keys
if (!key_id || !key_secret) {
  console.error("❌ Missing Razorpay Keys in .env");
  process.exit(1);
}

// Razorpay Instance
const razorpay = new Razorpay({
  key_id,
  key_secret,
});

// Test Route
app.get("/", (req, res) => {
  res.send(`Razorpay Backend Running in ${isLive ? "LIVE" : "TEST"} Mode`);
});

// CREATE ORDER
app.post("/create-order", async (req, res) => {
  try {
    let { amount } = req.body;
    amount = Number(amount);

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid Amount" });
    }

    const options = {
      amount: Math.round(amount * 100), // Convert rupees → paise
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    return res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("❌ Order Error:", error);
    return res.status(500).json({ success: false, message: "Order Failed" });
  }
});

// VERIFY PAYMENT
app.post("/verify-payment", (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSign = crypto
      .createHmac("sha256", key_secret)
      .update(sign)
      .digest("hex");

    if (expectedSign === razorpay_signature) {
      return res.json({ success: true });
    }

    return res.json({ success: false });
  } catch (error) {
    console.error("❌ Verification Error:", error);
    return res.json({ success: false });
  }
});

// Start Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✔️ Server running at http://localhost:${PORT}`);
});
