const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");
const bodyParser = require("body-parser");
const crypto = require("crypto");

const app = express();

app.use(cors());
app.use(bodyParser.json());

// 🔑 your Razorpay keys
const razorpay = new Razorpay({
  key_id: "rzp_test_yourKeyID",
  key_secret: "yourKeySecret",
});

// CREATE ORDER API
app.post("/create-order", async (req, res) => {
  const { amount } = req.body;

  const options = {
    amount: amount * 100,
    currency: "INR",
    receipt: "receipt_" + Date.now(),
  };

  try {
    const order = await razorpay.orders.create(options);
    res.send(order);
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: "Error creating order" });
  }
});

// VERIFY PAYMENT API
app.post("/verify-payment", (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", "yourKeySecret")
    .update(body.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    res.send({ success: true });
  } else {
    res.send({ success: false });
  }
});

app.listen(5000, () => {
  console.log("Razorpay server running on http://localhost:5000");
});
