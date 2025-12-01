require("dotenv").config();
const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

// Detect live or test mode
const isLive = process.env.NODE_ENV === "production";

// Pick keys based on environment
const key_id = isLive
  ? process.env.RAZORPAY_KEY_ID_LIVE
  : process.env.RAZORPAY_KEY_ID_TEST;

const key_secret = isLive
  ? process.env.RAZORPAY_KEY_SECRET_LIVE
  : process.env.RAZORPAY_KEY_SECRET_TEST;

// Debug log
console.log("Environment:", isLive ? "LIVE" : "TEST");
console.log("Loaded Key ID:", key_id);

// Key validation
if (!key_id || !key_secret) {
  console.error("❌ ERROR: Razorpay Keys Missing in .env");
  process.exit(1);
}

// Razorpay instance
const razorpay = new Razorpay({
  key_id,
  key_secret,
});

// Root route
app.get("/", (req, res) => {
  res.send(`Razorpay backend is running in ${isLive ? "LIVE" : "TEST"} mode ✔️`);
});

// CREATE ORDER
app.post("/create-order", async (req, res) => {
  try {
    let { amount } = req.body;

    // Ensure amount is a number and valid
    amount = Number(amount);

    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid amount received" });
    }

    // Convert RUPEES → PAISE (only backend does this)
    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    return res.json({
      success: true,
      orderId: order.id,
      amount: order.amount, // paise
      currency: order.currency,
    });
  } catch (error) {
    console.error("❌ CREATE ORDER ERROR:", error);
    return res
      .status(500)
      .json({ success: false, message: "Order creation failed" });
  }
});

// VERIFY PAYMENT
app.post("/verify-payment", (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    // Validate input
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.json({ success: false });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", key_secret)
      .update(body)
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      return res.json({ success: true });
    }

    return res.json({ success: false });
  } catch (error) {
    console.error("❌ VERIFY PAYMENT ERROR:", error);
    return res.json({ success: false });
  }
});

// START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✔️ Razorpay Server running on http://localhost:${PORT}`);
});
