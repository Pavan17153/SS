import axios from "axios";

const SERVER_URL = process.env.REACT_APP_SERVER_URL;

export const sendOrderStatusEmail = async (data) => {
    try {
        const res = await axios.post(
            `${SERVER_URL}/api/order-status-email`,
            {
                email: data.email,
                orderId: data.orderId,
                paymentId: data.paymentId,
                amount: data.amount,
                name: data.name,
                items: data.items,
                shippingAddress: data.shippingAddress,
                statusType: data.statusType,
            }
        );

        console.log("📧 Email sent:", res.data);
        return res.data;
    } catch (err) {
        console.error("❌ Email API failed:", err.message);
        throw err;
    }
};
