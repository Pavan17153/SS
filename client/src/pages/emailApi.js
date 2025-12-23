const API = "http://localhost:5000/api/email";

export const sendOrderPlacedEmail = async (data) => {
    await fetch(`${API}/client/order-placed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
};

export const sendOrderCancelledEmail = async (data) => {
    await fetch(`${API}/client/order-cancelled`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
};
