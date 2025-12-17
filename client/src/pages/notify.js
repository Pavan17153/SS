// src/pages/notify.js
import axios from "axios";

const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:5000";

export const sendOrderStatusEmail = async (data) => {
    try {
        await axios.post(
            `${SERVER_URL}/api/order-status-email`,
            data
        );
    } catch (err) {
        console.error("Order email failed:", err);
    }
};
