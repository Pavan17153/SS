import { doc, runTransaction } from "firebase/firestore";
import { db } from "../firebase";

export async function getNextOrderId() {
    const counterRef = doc(db, "orderCounter", "counter");

    const orderId = await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(counterRef);

        let current = snap.exists() ? snap.data().current : 0;
        current += 1;

        transaction.set(counterRef, { current }, { merge: true });

        return `SSF${String(current).padStart(4, "0")}`;
    });

    return orderId;
}
