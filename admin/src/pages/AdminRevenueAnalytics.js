import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Legend,
} from "recharts";
import "./AdminRevenueAnalytics.css";

/* ---------------- HELPERS ---------------- */
function toJSDate(createdAt) {
    if (!createdAt) return null;
    if (createdAt.toDate) return createdAt.toDate();
    if (createdAt.seconds) return new Date(createdAt.seconds * 1000);
    return null;
}

function formatDate(d) {
    return d ? d.toLocaleDateString() : "Unknown";
}

function formatMonth(d) {
    return d
        ? d.toLocaleString("default", { month: "short", year: "numeric" })
        : "Unknown";
}

/* ---------------- COMPONENT ---------------- */
export default function AdminRevenueAnalytics() {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    /* Filters */
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    /* KPIs */
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [deliveredRevenue, setDeliveredRevenue] = useState(0);
    const [deliveryCost, setDeliveryCost] = useState(0);
    const [profit, setProfit] = useState(0);

    /* Charts */
    const [dailyRevenue, setDailyRevenue] = useState([]);
    const [monthlyRevenue, setMonthlyRevenue] = useState([]);
    const [yearlyRevenue, setYearlyRevenue] = useState([]);
    const [categoryRevenue, setCategoryRevenue] = useState([]);
    const [bestSelling, setBestSelling] = useState([]);
    const [stockVsRevenue, setStockVsRevenue] = useState([]);

    const DELIVERY_CHARGE = 30;

    /* ---------------- REAL-TIME FETCH ---------------- */
    useEffect(() => {
        const unsub = onSnapshot(collection(db, "orders"), (snap) => {
            const data = snap.docs.map((d) => d.data());
            setOrders(data);
            setFilteredOrders(data);
            calculateAnalytics(data);
            setLoading(false);
        });

        return () => unsub();
    }, []);

    /* ---------------- DATE FILTER ---------------- */
    useEffect(() => {
        let data = [...orders];

        if (fromDate) {
            const from = new Date(fromDate);
            data = data.filter((o) => {
                const d = toJSDate(o.createdAt);
                return d && d >= from;
            });
        }

        if (toDate) {
            const to = new Date(toDate);
            to.setHours(23, 59, 59, 999);
            data = data.filter((o) => {
                const d = toJSDate(o.createdAt);
                return d && d <= to;
            });
        }

        setFilteredOrders(data);
        calculateAnalytics(data);
    }, [fromDate, toDate, orders]);

    /* ---------------- ANALYTICS ---------------- */
    const calculateAnalytics = (data) => {
        let total = 0;
        let delivered = 0;
        let deliveryTotal = 0;

        const daily = {};
        const monthly = {};
        const yearly = {};
        const category = {};
        const productMap = {};
        const stockMap = {};

        data.forEach((o) => {
            const price = Number(o.totalPrice || 0);
            const date = toJSDate(o.createdAt);
            const status = (o.status || "").toLowerCase();

            total += price;

            if (status === "delivered" && date) {
                delivered += price;
                deliveryTotal += DELIVERY_CHARGE;

                daily[formatDate(date)] =
                    (daily[formatDate(date)] || 0) + price;

                monthly[formatMonth(date)] =
                    (monthly[formatMonth(date)] || 0) + price;

                yearly[date.getFullYear()] =
                    (yearly[date.getFullYear()] || 0) + price;

                (o.items || []).forEach((item) => {
                    const name = item.name || "Unknown";
                    const qty = Number(item.quantity || 1);
                    const stock = Number(item.stock || 0);

                    productMap[name] = (productMap[name] || 0) + qty;

                    stockMap[name] = {
                        revenue: (stockMap[name]?.revenue || 0) + price,
                        stock,
                    };

                    const cat = item.category || "Other";
                    category[cat] = (category[cat] || 0) + price;
                });
            }
        });

        setTotalRevenue(total);
        setDeliveredRevenue(delivered);
        setDeliveryCost(deliveryTotal);
        setProfit(delivered - deliveryTotal);

        setDailyRevenue(
            Object.entries(daily).map(([date, revenue]) => ({
                date,
                revenue: Number(revenue),
            }))
        );

        setMonthlyRevenue(
            Object.entries(monthly).map(([month, revenue]) => ({
                month,
                revenue: Number(revenue),
            }))
        );

        setYearlyRevenue(
            Object.entries(yearly).map(([year, revenue]) => ({
                year,
                revenue: Number(revenue),
            }))
        );

        setCategoryRevenue(
            Object.entries(category).map(([name, value]) => ({
                name,
                value: Number(value),
            }))
        );

        setBestSelling(
            Object.entries(productMap)
                .map(([name, sold]) => ({ name, sold }))
                .sort((a, b) => b.sold - a.sold)
                .slice(0, 5)
        );

        setStockVsRevenue(
            Object.entries(stockMap).map(([name, v]) => ({
                name,
                revenue: Number(v.revenue),
                stock: Number(v.stock),
            }))
        );
    };

    if (loading) return <p className="admin-center">Loading analytics…</p>;

    return (
        <div className="admin-analytics">
            <h2>📊 Revenue Analytics Dashboard</h2>

            {/* FILTER BAR */}
            <div className="filter-bar">
                <div>
                    <label>From</label>
                    <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                    />
                </div>
                <div>
                    <label>To</label>
                    <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                    />
                </div>
            </div>

            {/* KPI */}
            <div className="analytics-grid">
                <div className="analytics-card">
                    <h4>Total Revenue</h4>
                    <p>₹{totalRevenue}</p>
                </div>
                <div className="analytics-card">
                    <h4>Delivered Revenue</h4>
                    <p>₹{deliveredRevenue}</p>
                </div>
                <div className="analytics-card">
                    <h4>Delivery Cost</h4>
                    <p>₹{deliveryCost}</p>
                </div>
                <div className="analytics-card profit">
                    <h4>Net Profit</h4>
                    <p>₹{profit}</p>
                </div>
            </div>

            <ChartCard title="Daily Revenue">
                <LineChart data={dailyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line dataKey="revenue" strokeWidth={3} />
                </LineChart>
            </ChartCard>

            <ChartCard title="Monthly Revenue">
                <BarChart data={monthlyRevenue}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="revenue" />
                </BarChart>
            </ChartCard>

            <ChartCard title="Yearly Revenue Comparison">
                <BarChart data={yearlyRevenue}>
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="revenue" />
                </BarChart>
            </ChartCard>

            <ChartCard title="Best Selling Products">
                <BarChart data={bestSelling} layout="vertical">
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" />
                    <Tooltip />
                    <Bar dataKey="sold" />
                </BarChart>
            </ChartCard>

            <ChartCard title="Stock vs Revenue">
                <BarChart data={stockVsRevenue}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" />
                    <Bar dataKey="stock" />
                </BarChart>
            </ChartCard>

            <ChartCard title="Category Revenue">
                <PieChart>
                    <Pie
                        data={categoryRevenue}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={120}
                        label
                    >
                        {categoryRevenue.map((_, i) => (
                            <Cell key={i} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ChartCard>
        </div>
    );
}

/* -------- REUSABLE CARD -------- */
function ChartCard({ title, children }) {
    return (
        <div className="analytics-card big">
            <h3>{title}</h3>
            <ResponsiveContainer width="100%" height={320}>
                {children}
            </ResponsiveContainer>
        </div>
    );
}
