import React, { useEffect, useRef, useState } from "react";
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    updateDoc,
    doc,
} from "firebase/firestore";
import { db } from "../firebase";
import { FaBell, FaVolumeMute, FaVolumeUp } from "react-icons/fa";
import { useNavigate } from "react-router-dom"; // ✅ ADDED
import "./AdminNotificationsBell.css";

export default function AdminNotificationsBell() {
    const [notifications, setNotifications] = useState([]);
    const [open, setOpen] = useState(false);
    const [muted, setMuted] = useState(false);
    const [volume, setVolume] = useState(0.8);

    const audioRef = useRef(null);
    const prevCountRef = useRef(0);
    const audioUnlockedRef = useRef(false);

    const navigate = useNavigate(); // ✅ ADDED

    useEffect(() => {
        const q = query(
            collection(db, "adminNotifications"),
            orderBy("createdAt", "desc")
        );

        const unsub = onSnapshot(q, (snap) => {
            const list = snap.docs.map((d) => ({
                id: d.id,
                ...d.data(),
            }));

            setNotifications(list);

            // 🔊 PLAY SOUND ONLY FOR NEW NOTIFICATIONS
            if (
                audioUnlockedRef.current &&
                !muted &&
                snap.size > prevCountRef.current &&
                prevCountRef.current !== 0 &&
                audioRef.current
            ) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(() => { });
            }

            prevCountRef.current = snap.size;
        });

        return () => unsub();
    }, [muted]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
            audioRef.current.muted = muted;
        }
    }, [volume, muted]);

    const unreadCount = notifications.filter((n) => !n.read).length;

    // ✅ MARK AS READ + REDIRECT
    const handleNotificationClick = async (id) => {
        await updateDoc(doc(db, "adminNotifications", id), {
            read: true,
        });

        setOpen(false); // close dropdown
        navigate("/orders"); // ✅ REDIRECT TO Orders.js
    };

    const handleBellClick = () => {
        // 🔓 UNLOCK AUDIO ON FIRST USER CLICK
        if (!audioUnlockedRef.current && audioRef.current) {
            audioRef.current.muted = true;
            audioRef.current
                .play()
                .then(() => {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                    audioRef.current.muted = false;
                    audioUnlockedRef.current = true;
                })
                .catch(() => { });
        }

        setOpen(!open);
    };

    return (
        <div className="admin-bell-wrapper">
            {/* 🔊 AUDIO */}
            <audio ref={audioRef} src="/notification.mp3" preload="auto" />

            {/* 🔔 BELL ICON */}
            <div
                className={`bell-icon ${unreadCount > 0 ? "has-unread" : ""}`}
                onClick={handleBellClick}
                title="Notifications"
            >
                <FaBell />
                {unreadCount > 0 && (
                    <span className="bell-count">{unreadCount}</span>
                )}
            </div>

            {open && (
                <div className="bell-dropdown">
                    {/* 🔊 SOUND CONTROLS */}
                    <div className="bell-controls">
                        <button onClick={() => setMuted(!muted)}>
                            {muted ? <FaVolumeMute /> : <FaVolumeUp />}
                        </button>

                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={volume}
                            onChange={(e) =>
                                setVolume(parseFloat(e.target.value))
                            }
                        />
                    </div>

                    {/* 📜 SCROLLABLE NOTIFICATION LIST */}
                    <div className="bell-list">
                        {notifications.length === 0 && (
                            <p className="bell-empty">No notifications</p>
                        )}

                        {notifications.map((n) => (
                            <div
                                key={n.id}
                                className={`bell-item ${n.read ? "" : "unread"}`}
                                onClick={() => handleNotificationClick(n.id)} // ✅ FIXED
                            >
                                <strong>{n.title}</strong>
                                <p>{n.message}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
