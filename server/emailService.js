import { sendZeptoMail } from "./zeptoMail.js";

export const sendOrderStatusEmail = async ({
  email,
  orderId,
  paymentId,
  amount,
  name,
  items = [],
  shippingAddress,
  statusType,
  estimatedDelivery,
}) => {
  if (!statusType) throw new Error("statusType is missing");

  const normalizedStatus =
    statusType.trim().charAt(0).toUpperCase() +
    statusType.trim().slice(1).toLowerCase();

  const statusMap = {
    Placed: {
      subject: "Your SS Fashion order has been placed",
      label: "Order Confirmed",
      color: "#067D62",
      message:
        "Thank you for shopping with SS Fashion. Your order has been received and is being prepared.",
    },
    Shipped: {
      subject: "Your SS Fashion order has shipped",
      label: "Order Shipped",
      color: "#C45500",
      message: "Good news! Your order has been shipped and is on its way.",
    },
    Delivered: {
      subject: "Your SS Fashion order has been delivered",
      label: "Order Delivered",
      color: "#007600",
      message:
        "Your order has been delivered successfully. We hope you love it!",
    },
    Cancelled: {
      subject: "Your SS Fashion order was cancelled",
      label: "Order Cancelled",
      color: "#B12704",
      message:
        "This order has been cancelled. If this wasn’t expected, please contact support.",
    },
  };

  const status = statusMap[normalizedStatus];
  if (!status) throw new Error(`Invalid status type: ${statusType}`);

  /* ---------- ITEMS ROWS (Amazon-style, no rowspan) ---------- */
  const itemsRows = items
    .map(
      (i) => `
<tr>
  <td style="padding:10px;border:1px solid #DDD;font-size:13px;">${orderId}</td>
  <td style="padding:10px;border:1px solid #DDD;font-size:13px;">${i.name}</td>
  <td align="center" style="padding:10px;border:1px solid #DDD;font-size:13px;">${i.qty}</td>
  <td align="right" style="padding:10px;border:1px solid #DDD;font-size:13px;">₹${i.price}</td>
  <td align="right" style="padding:10px;border:1px solid #DDD;font-size:13px;">₹${i.qty * i.price}</td>
</tr>`
    )
    .join("");

  /* ---------- HTML ---------- */
  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#EAEDED;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center" style="padding:24px 0;">

<table width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #DDD;">

<!-- HEADER -->
<tr>
<td style="padding:18px 24px;border-bottom:1px solid #DDD;">
  <strong style="font-size:20px;color:#111;">SS Fashion</strong><br/>
  <span style="font-size:12px;color:#555;">Order Update</span>
</td>
</tr>

<!-- STATUS -->
<tr>
<td style="background:${status.color};padding:12px 24px;color:#FFF;font-size:14px;font-weight:bold;">
  ${status.label}
</td>
</tr>

<!-- MESSAGE -->
<tr>
<td style="padding:20px 24px;font-size:13px;color:#111;line-height:20px;">
  Hello <strong>${name}</strong>,<br/><br/>
  ${status.message}
</td>
</tr>

<!-- ORDER SUMMARY -->
<tr>
<td style="padding:0 24px 16px;font-size:13px;color:#111;">
  <strong>Order ID:</strong> ${orderId}<br/>
  ${paymentId ? `<strong>Payment ID:</strong> ${paymentId}<br/>` : ""}
  <strong>Order Total:</strong> ₹${amount}
</td>
</tr>

<!-- ORDER TABLE -->
<tr>
<td style="padding:0 24px 24px;">
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
<tr style="background:#F7F7F7;font-size:12px;color:#555;">
  <th style="padding:10px;border:1px solid #DDD;">Order ID</th>
  <th style="padding:10px;border:1px solid #DDD;">Item</th>
  <th style="padding:10px;border:1px solid #DDD;">Qty</th>
  <th style="padding:10px;border:1px solid #DDD;">Price</th>
  <th style="padding:10px;border:1px solid #DDD;">Subtotal</th>
</tr>

${itemsRows}

</table>
</td>
</tr>

${estimatedDelivery
      ? `
<tr>
<td style="padding:0 24px 16px;font-size:13px;">
<strong>Estimated Delivery:</strong> ${estimatedDelivery}
</td>
</tr>` : ""
    }

${shippingAddress
      ? `
<tr>
<td style="padding:0 24px 20px;font-size:13px;">
<strong>Shipping Address</strong><br/>
${shippingAddress.address1}<br/>
${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.pin}
</td>
</tr>` : ""
    }

<!-- SUPPORT -->
<tr>
<td style="padding:16px 24px;background:#F7F7F7;font-size:12px;color:#333;">
<strong>Need help?</strong><br/>
Contact us at
<a href="mailto:support@ssfashion.com" style="color:#0066C0;text-decoration:none;">
support@ssfashion.com
</a>
</td>
</tr>

<!-- FOOTER -->
<tr>
<td style="padding:16px 24px;border-top:1px solid #DDD;font-size:11px;color:#555;">
Follow SS Fashion for latest collections & offers<br/><br/>

<a href="https://www.instagram.com/ss.fashion_collections?igsh=eTZyMnptM2ZhaGhn">
<img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" width="18"/>
</a>&nbsp;
<a href="#">
<img src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png" width="18"/>
</a>&nbsp;
<a href="#">
<img src="https://cdn-icons-png.flaticon.com/512/5968/5968830.png" width="18"/>
</a>

<br/><br/>
© ${new Date().getFullYear()} SS Fashion. All rights reserved.
</td>
</tr>

</table>
</td>
</tr>
</table>
</body>
</html>
`;

  await sendZeptoMail({
    to: email,
    subject: status.subject,
    html,
  });
};
