import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Razorpay from "razorpay";
import crypto from "crypto";
import notifyRoutes from "./notifyRoutes.js";

dotenv.config({ override: true });

const app = express();
app.use(cors());
app.use(express.json());

/* =========================
   RAZORPAY SETUP (SAFE)
========================= */
const razorpayMode = process.env.RAZORPAY_MODE || "test";

const key_id =
  razorpayMode === "live"
    ? process.env.RAZORPAY_KEY_ID_LIVE
    : process.env.RAZORPAY_KEY_ID_TEST;

const key_secret =
  razorpayMode === "live"
    ? process.env.RAZORPAY_KEY_SECRET_LIVE
    : process.env.RAZORPAY_KEY_SECRET_TEST;

if (!key_id || !key_secret) {
  console.warn("⚠️ Razorpay keys not loaded yet");
}

const razorpay = new Razorpay({ key_id, key_secret });

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (req, res) => {
  res.send("✅ SS Fashion Backend Running");
});

/* =========================
   CREATE ORDER
========================= */
app.post("/create-order", async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
    });
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ success: false });
  }
});

/* =========================
   VERIFY PAYMENT
========================= */
app.post("/verify-payment", (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const sign = razorpay_order_id + "|" + razorpay_payment_id;

  const expected = crypto
    .createHmac("sha256", key_secret)
    .update(sign)
    .digest("hex");

  res.json({ success: expected === razorpay_signature });
});

/* =========================
   EMAIL ROUTES
========================= */
app.use("/api", notifyRoutes);

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
