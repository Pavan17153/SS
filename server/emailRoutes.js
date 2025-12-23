import express from "express";
import { sendZeptoMail } from "./zeptoMail.js";

const router = express.Router();

/* ===============================
   CLIENT — ORDER PLACED
================================ */
router.post("/client/order-placed", async (req, res) => {
  try {
    const { email, orderId, amount } = req.body;

    await sendZeptoMail({
      to: email,
      subject: "Order Confirmed - SS Fashion",
      html: `
        <h2>Thank you for your order</h2>
        <p>Order ID: <b>${orderId}</b></p>
        <p>Amount Paid: ₹${amount}</p>
      `,
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

/* ===============================
   CLIENT — ORDER CANCELLED
================================ */
router.post("/client/order-cancelled", async (req, res) => {
  try {
    const { email, orderId } = req.body;

    await sendZeptoMail({
      to: email,
      subject: "Order Cancelled - SS Fashion",
      html: `
        <h2>Your order has been cancelled</h2>
        <p>Order ID: <b>${orderId}</b></p>
      `,
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/* ===============================
   ADMIN — ORDER SHIPPED
================================ */
router.post("/admin/order-shipped", async (req, res) => {
  try {
    const { orderId } = req.body;

    await sendZeptoMail({
      to: process.env.ADMIN_EMAIL,
      subject: "Order Shipped",
      html: `<p>Order <b>${orderId}</b> has been shipped</p>`,
    });

    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

/* ===============================
   ADMIN — ORDER DELIVERED
================================ */
router.post("/admin/order-delivered", async (req, res) => {
  try {
    const { orderId } = req.body;

    await sendZeptoMail({
      to: process.env.ADMIN_EMAIL,
      subject: "Order Delivered",
      html: `<p>Order <b>${orderId}</b> has been delivered</p>`,
    });

    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

export default router;
