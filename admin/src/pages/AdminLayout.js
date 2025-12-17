import React from "react";
import { Outlet } from "react-router-dom";
import AdminNotificationsBell from "../pages/AdminNotificationsBell";
import "./AdminLayout.css";

export default function AdminLayout() {
    return (
        <div className="admin-layout">
            {/* 🔔 GLOBAL HEADER */}
            <header className="admin-header">
                <h2>SS Fashion Admin</h2>
                <AdminNotificationsBell />
            </header>

            {/* ALL ADMIN PAGES LOAD HERE */}
            <main className="admin-content">
                <Outlet />
            </main>
        </div>
    );
}
