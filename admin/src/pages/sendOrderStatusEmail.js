import axios from "axios";

export const sendOrderStatusEmail = async (data) => {
    try {
        await axios.post(
            "http://localhost:5000/api/order-status-email", // ✅ FIXED
            data
        );
    } catch (err) {
        console.error("Status email failed", err.response?.data || err);
    }
};
