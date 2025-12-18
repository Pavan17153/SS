import nodemailer from "nodemailer";

export const sendOrderStatusEmail = async ({
  email,
  orderId,
  paymentId,
  amount,
  name,
  items = [],
  shippingAddress,
  statusType = "Placed", // Placed | shipped | delivered | Cancelled
}) => {
  /* ================= TRANSPORTER (RENDER SAFE) ================= */
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Gmail APP PASSWORD
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 20000,
  });

  /* ================= ITEMS TABLE ================= */
  const itemsHtml = items.length
    ? items
      .map(
        (i) => `
        <tr>
          <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;">${i.name}</td>
          <td align="center" style="padding:12px 8px;border-bottom:1px solid #e5e7eb;">${i.qty}</td>
          <td align="right" style="padding:12px 8px;border-bottom:1px solid #e5e7eb;">₹${i.price}</td>
        </tr>`
      )
      .join("")
    : `<tr><td colspan="3" style="padding:12px;">No items</td></tr>`;

  /* ================= ADDRESS FORMAT ================= */
  const formatAddress = (a) =>
    a
      ? `
        ${a.address1}${a.address2 ? ", " + a.address2 : ""}<br/>
        ${a.city}, ${a.state} - ${a.pin}<br/>
        Phone: ${a.phone}
      `
      : "—";

  /* ================= STATUS HANDLING ================= */
  let titleText = "Order Confirmed";
  let statusMessage =
    "Thank you for shopping with SS Fashion. Your order has been placed successfully.";
  let statusColor = "#22c55e";
  let statusLabel = "Order Placed";

  switch (statusType) {
    case "shipped":
      titleText = "Order Shipped";
      statusMessage =
        "Good news! Your order has been shipped and is on the way.";
      statusColor = "#2563eb";
      statusLabel = "Shipped 🚚";
      break;

    case "delivered":
      titleText = "Order Delivered";
      statusMessage =
        "Your order has been delivered successfully. We hope you love your purchase!";
      statusColor = "#16a34a";
      statusLabel = "Delivered ✅";
      break;

    case "Cancelled":
      titleText = "Order Cancelled";
      statusMessage =
        "Your order has been cancelled. The paid amount will be refunded to your original payment method within 2–3 working days.";
      statusColor = "#dc2626";
      statusLabel = "Cancelled ❌";
      break;

    default:
      break;
  }

  const showUpdateNote =
    statusType === "Placed" || statusType === "shipped";

  /* ================= EMAIL HTML ================= */
  const html = `
  <div style="background:#f1f3f6;padding:24px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:640px;margin:auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

      <!-- HEADER -->
      <div style="background:#131921;padding:20px;text-align:center;">
        <h1 style="color:#ffffff;margin:0;font-size:26px;">SS Fashion</h1>
        <p style="color:#e5e7eb;margin:6px 0 0;font-size:15px;">${titleText}</p>
      </div>

      <!-- BODY -->
      <div style="padding:24px;">
        <h2>Hello ${name},</h2>
        <p style="font-size:15px;color:#333;">${statusMessage}</p>

        <!-- ORDER SUMMARY -->
        <div style="border:1px solid #e5e7eb;border-radius:6px;padding:16px;margin:20px 0;background:#fafafa;">
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p><strong>Payment ID:</strong> ${paymentId || "—"}</p>
          <p><strong>Total Amount:</strong> ₹${amount}</p>
          <p>
            <strong>Status:</strong>
            <span style="color:${statusColor};font-weight:bold;">${statusLabel}</span>
          </p>
        </div>

        <!-- ITEMS -->
        <h3>Order Items</h3>
        <table width="100%" style="border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:#f3f4f6;">
              <th align="left" style="padding:10px;">Item</th>
              <th align="center" style="padding:10px;">Qty</th>
              <th align="right" style="padding:10px;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- ADDRESS -->
        <h3 style="margin-top:24px;">Shipping Address</h3>
        <div style="background:#f9fafb;padding:14px;border-radius:6px;font-size:14px;">
          ${formatAddress(shippingAddress)}
        </div>

        ${showUpdateNote
      ? `<p style="margin-top:24px;font-size:14px;color:#555;">
                You will receive further updates when your order status changes.
              </p>`
      : ""
    }

        <p style="font-size:14px;">
          Regards,<br/>
          <strong>SS Fashion Team</strong>
        </p>
      </div>

      <!-- SOCIAL MEDIA -->
      <div style="background:#f3f4f6;padding:18px;text-align:center;">
        <p style="margin:0 0 10px;font-size:14px;">Follow us for latest collections</p>

        <a href="https://www.instagram.com/ss.fashion_collections?igsh=eTZyMnptM2ZhaGhn">
          <img src="https://img.icons8.com/fluency/32/instagram-new.png"/>
        </a>
        <a href="#">
          <img src="https://img.icons8.com/color/32/twitterx--v1.png"/>
        </a>
        <a href="#">
          <img src="https://img.icons8.com/color/32/youtube-play.png"/>
        </a>
      </div>

      <!-- FOOTER -->
      <div style="background:#f3f4f6;padding:14px;text-align:center;font-size:12px;color:#777;">
        © ${new Date().getFullYear()} SS Fashion. All rights reserved.
      </div>

    </div>
  </div>
  `;

  /* ================= SEND MAIL ================= */
  await transporter.sendMail({
    from: `"SS Fashion" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Your Order ${orderId} - ${statusLabel}`,
    html,
  });
};
