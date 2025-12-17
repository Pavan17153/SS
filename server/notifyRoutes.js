import express from "express";
import { sendOrderStatusEmail } from "./emailService.js";

const router = express.Router();

router.post("/order-status-email", async (req, res) => {
    try {
        await sendOrderStatusEmail(req.body);
        res.json({ success: true });
    } catch (err) {
        console.error("Email error:", err);
        res.status(500).json({ success: false });
    }
});

export default router;
