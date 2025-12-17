import axios from "axios";

export const sendOrderSMS = async ({ phone, orderId, amount }) => {
    try {
        const response = await axios.post(
            "https://www.fast2sms.com/dev/bulkV2",
            {
                route: "q",                  // ✅ QUICK SMS
                message: `SS Fashion: Order ${orderId} confirmed. Amount ₹${amount}. Thank you for shopping with us.`,
                language: "english",
                numbers: phone               // ✅ no +91
            },
            {
                headers: {
                    authorization: process.env.FAST2SMS_KEY,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("✅ SMS SENT:", response.data);
    } catch (error) {
        console.error("❌ SMS FAILED:", error.response?.data || error.message);
    }
};
