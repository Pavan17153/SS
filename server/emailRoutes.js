import express from "express";
import { sendOrderStatusEmail } from "./emailService.js";

const router = express.Router();

router.post("/order-status-email", async (req, res) => {
  try {
    console.log("🔥 /order-status-email body:", req.body);
    await sendOrderStatusEmail(req.body);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Email error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
