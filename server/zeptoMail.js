import axios from "axios";

export const sendZeptoMail = async ({ to, subject, html }) => {
    try {
        console.log("📨 Sending email to:", to);

        const response = await axios.post(
            "https://api.zeptomail.in/v1.1/email",
            {
                from: {
                    address: process.env.ZEPTO_FROM_EMAIL,
                    name: process.env.ZEPTO_FROM_NAME,
                },
                to: [{ email_address: { address: to } }],
                subject,
                htmlbody: html,
            },
            {
                headers: {
                    Authorization: `Zoho-enczapikey ${process.env.ZEPTO_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        console.log("📨 ZeptoMail response:", response.data);
        return response.data;
    } catch (err) {
        console.error("❌ ZeptoMail failed:", err.response?.data || err.message);
        throw err;
    }
};
