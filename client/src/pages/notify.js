import axios from "axios";

export const sendOrderStatusEmail = async (data) => {
    try {
        await axios.post(
            "http://localhost:5000/api/order-status-email",
            data
        );
    } catch (err) {
        console.error("Order email failed:", err);
    }
};
