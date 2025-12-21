import nodemailer from "nodemailer";

export const sendOrderStatusEmail = async ({
  email,
  orderId,
  paymentId,
  amount,
  name,
  statusType = "Placed",
  items = [],
  shippingAddress = {},
}) => {
  if (!email) throw new Error("Email missing");

  console.log("📨 Sending email to:", email);

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      minVersion: "TLSv1.2",
      rejectUnauthorized: false,
    },
  });

  await transporter.verify();
  console.log("✅ SMTP verified");

  const itemsHtml = items.map(
    (i) => `
      <tr>
        <td>${i.name}</td>
        <td align="center">${i.qty}</td>
        <td align="right">₹${i.price}</td>
      </tr>`
  ).join("");

  const html = `
  <div style="font-family:Arial;background:#f3f3f3;padding:20px">
    <div style="max-width:620px;margin:auto;background:#fff;padding:24px;border-radius:8px">
      <h2 style="color:#232f3e">SS Fashion – Order ${statusType}</h2>
      <p>Hello <b>${name}</b>,</p>
      <p>Your order has been <b>${statusType}</b>.</p>

      <p><b>Order ID:</b> ${orderId}</p>
      <p><b>Payment ID:</b> ${paymentId}</p>
      <p><b>Total:</b> ₹${amount}</p>

      <h3>Items</h3>
      <table width="100%" border="1" cellpadding="8">
        <tr><th>Product</th><th>Qty</th><th>Price</th></tr>
        ${itemsHtml}
      </table>

      <h3>Shipping Address</h3>
      <p>
        ${shippingAddress.address1 || ""}<br/>
        ${shippingAddress.city || ""}, ${shippingAddress.state || ""}<br/>
        PIN: ${shippingAddress.pin || ""}<br/>
        Phone: ${shippingAddress.phone || ""}
      </p>

      <p style="font-size:12px;color:#777">
        This is an automated email. Please do not reply.
      </p>
    </div>
  </div>
  `;

  await transporter.sendMail({
    from: `"SS Fashion Orders" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: `Order ${statusType} – ${orderId}`,
    html,
  });

  console.log("📤 Email sent successfully");
};
