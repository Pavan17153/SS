const API = "http://localhost:5000/api/email";

export const sendShippedEmail = async (orderId) => {
    await fetch(`${API}/admin/order-shipped`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
    });
};

export const sendDeliveredEmail = async (orderId) => {
    await fetch(`${API}/admin/order-delivered`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
    });
};
