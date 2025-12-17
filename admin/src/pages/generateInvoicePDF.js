import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";

/* 🔵 Replace later with Base64 logo */
const LOGO_BASE64 = "";

export async function generateInvoicePDF(order, mode = "download") {
    const doc = new jsPDF("p", "mm", "a4");

    const billing = order.billingDetails || {};
    const items = order.items || [];

    const invoiceNo = order.invoiceNo || "INV-0000";
    const orderDate = new Date(
        order.createdAt?.seconds
            ? order.createdAt.seconds * 1000
            : Date.now()
    ).toLocaleDateString("en-IN");

    /* ================= CALCULATIONS ================= */

    const subTotal = items.reduce(
        (sum, it) => sum + (it.qty || 1) * it.price,
        0
    );

    let shipping = 0;
    if (items.length > 0) {
        if (subTotal <= 1500) shipping = 60;
        else if (subTotal <= 3000) shipping = 120;
        else if (subTotal <= 4500) shipping = 180;
        else shipping = 240;
    }

    const grandTotal = subTotal + shipping;

    /* ================= PAGE BORDER ================= */
    doc.setDrawColor(220);
    doc.rect(8, 8, 194, 281);

    /* ================= HEADER ================= */
    if (LOGO_BASE64) {
        doc.addImage(LOGO_BASE64, "PNG", 14, 14, 24, 20);
    }

    doc.setFontSize(20);
    doc.setTextColor(33);
    doc.text("SS Fashion", 105, 20, { align: "center" });

    doc.setFontSize(9);
    doc.setTextColor(90);
    doc.text("Premium Boutique Wear & Custom Stitching", 105, 26, {
        align: "center",
    });

    doc.setDrawColor(200);
    doc.line(14, 30, 195, 30);

    doc.setFontSize(10);
    doc.setTextColor(40);
    doc.text(`Invoice No: ${invoiceNo}`, 150, 18);
    doc.text(`Invoice Date: ${orderDate}`, 150, 24);

    doc.setFontSize(12);
    doc.text("TAX INVOICE", 14, 24);

    /* ================= SELLER & BUYER ================= */
    doc.setDrawColor(230);
    doc.rect(14, 36, 86, 42);
    doc.rect(104, 36, 91, 42);

    doc.setFontSize(11);
    doc.text("Sold By", 18, 42);
    doc.text("Bill To", 108, 42);

    doc.setFontSize(9);
    doc.text(
        [
            "SS Fashion",
            "Custom Boutique Wear",
            "India",
            "Support: support@ssfashion.com",
            "Phone: +91-XXXXXXXXXX",
        ],
        18,
        48
    );

    doc.text(
        [
            `${billing.firstName || ""} ${billing.lastName || ""}`,
            billing.address1 || "",
            billing.address2 || "",
            `${billing.city || ""}, ${billing.state || ""} - ${billing.pin || ""}`,
            `Phone: ${billing.phone || ""}`,
            `Email: ${billing.email || ""}`,
        ],
        108,
        48
    );

    /* ================= ITEMS TABLE ================= */
    const tableData = items.map((it, i) => [
        i + 1,
        it.name,
        it.category || "-",
        it.qty || 1,
        `₹${it.price}`,
        `₹${(it.qty || 1) * it.price}`,
    ]);

    autoTable(doc, {
        startY: 86,
        head: [["#", "Product Description", "Category", "Qty", "Price", "Amount"]],
        body: tableData,
        theme: "grid",
        styles: {
            fontSize: 9,
            cellPadding: 3,
            valign: "middle",
        },
        headStyles: {
            fillColor: [33, 37, 41],
            textColor: 255,
            halign: "center",
        },
        columnStyles: {
            0: { halign: "center", cellWidth: 10 },
            3: { halign: "center" },
            4: { halign: "right" },
            5: { halign: "right" },
        },
    });

    /* ================= TOTAL SUMMARY ================= */
    const y = doc.lastAutoTable.finalY + 8;

    doc.setDrawColor(180);
    doc.rect(120, y, 75, 34);

    doc.setFontSize(10);
    doc.text("Subtotal", 125, y + 8);
    doc.text(`₹${subTotal}`, 190, y + 8, { align: "right" });

    doc.text("Delivery Charges", 125, y + 16);
    doc.text(`₹${shipping}`, 190, y + 16, { align: "right" });

    doc.setFontSize(12);
    doc.text("Grand Total", 125, y + 26);
    doc.text(`₹${grandTotal}`, 190, y + 26, { align: "right" });

    doc.setFontSize(9);
    doc.text("NON-GST Invoice (As per Indian tax norms)", 14, y + 18);

    /* ================= QR CODE ================= */
    const qrPayload =
        `SS Fashion Invoice\n` +
        `Invoice No: ${invoiceNo}\n` +
        `Order ID: ${order.id}\n` +
        `Amount: ₹${grandTotal}\n` +
        `Date: ${orderDate}`;

    const qrImage = await QRCode.toDataURL(qrPayload, {
        errorCorrectionLevel: "H",
        margin: 2,
        width: 220,
    });

    doc.addImage(qrImage, "PNG", 14, y + 22, 32, 32);
    doc.setFontSize(8);
    doc.text("Scan QR for invoice details", 14, y + 58);

    /* ================= FOOTER ================= */
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(
        "This is a computer-generated invoice. No signature required.",
        105,
        278,
        { align: "center" }
    );

    doc.text(
        "Thank you for shopping with SS Fashion ❤️ Visit us again!",
        105,
        284,
        { align: "center" }
    );

    if (mode === "download") {
        doc.save(`${invoiceNo}.pdf`);
    } else {
        return doc;
    }
}
