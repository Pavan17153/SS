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
      user: "apikey",
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.verify();

  const html = `
    <h2>Order Confirmed</h2>
    <p>Hello ${name}</p>
    <p>Order ID: ${orderId}</p>
    <p>Amount: ₹${amount}</p>
    <p>Status: ${statusType}</p>
  `;

  await transporter.sendMail({
    from: "SS Fashion <no-reply@ssfashion.in>", // IMPORTANT
    to: email,
    subject: `Order ${statusType} - ${orderId}`,
    html,
  });
};
