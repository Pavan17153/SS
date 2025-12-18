import nodemailer from "nodemailer";

export const sendOrderStatusEmail = async ({
  email,
  orderId,
  paymentId,
  amount,
  name,
  statusType = "Placed",
}) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const statusMap = {
    Placed: { title: "Order Confirmed", label: "Placed 🟢" },
    shipped: { title: "Order Shipped", label: "Shipped 🚚" },
    delivered: { title: "Order Delivered", label: "Delivered ✅" },
    Cancelled: { title: "Order Cancelled", label: "Cancelled ❌" },
  };

  const { title, label } = statusMap[statusType];

  const html = `
    <div style="font-family:Arial;padding:20px">
      <h2>${title}</h2>
      <p>Hello ${name},</p>
      <p><b>Order ID:</b> ${orderId}</p>
      <p><b>Payment ID:</b> ${paymentId || "-"}</p>
      <p><b>Amount:</b> ₹${amount}</p>
      <p><b>Status:</b> ${label}</p>
      <br/>
      <p>— SS Fashion Team</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"SS Fashion" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `${title} - ${orderId}`,
    html,
  });
};
