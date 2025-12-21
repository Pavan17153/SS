import axios from "axios";

const SERVER_URL = process.env.REACT_APP_SERVER_URL;

export const sendOrderStatusEmail = async (data) => {
    try {
        const res = await axios.post(
            `${SERVER_URL}/api/order-status-email`,
            data
        );
        console.log("📧 Email API response:", res.data);
    } catch (err) {
        console.error(
            "❌ Email API failed:",
            err.response?.data || err.message
        );
    }
};
