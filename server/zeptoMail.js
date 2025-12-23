import axios from "axios";

export const sendZeptoMail = async ({
    to,
    subject,
    html,
}) => {
    const response = await axios.post(
        "https://api.zeptomail.in/v1.1/email",
        {
            from: {
                address: process.env.ZEPTO_FROM_EMAIL,
                name: process.env.ZEPTO_FROM_NAME,
            },
            to: [
                {
                    email_address: {
                        address: to,
                    },
                },
            ],
            subject,
            htmlbody: html,
        },
        {
            headers: {
                Authorization: process.env.ZEPTO_API_KEY,
                "Content-Type": "application/json",
            },
        }
    );

    return response.data;
};
