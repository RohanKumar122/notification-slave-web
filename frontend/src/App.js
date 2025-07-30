import React, { useEffect, useState, useRef } from "react";
import { messaging } from "./firebase";
import { getToken, onMessage } from "firebase/messaging";
import axios from "axios";
import { CheckCircle, Circle } from "lucide-react";

const backendURL = process.env.REACT_APP_BACKEND_URL;
const vapidKey = process.env.REACT_APP_VAPID_KEY;

function App() {
  const [messages, setMessages] = useState([]);
  const [fcmToken, setFcmToken] = useState(null);
  const [name, setName] = useState("");
  const [seenMessages, setSeenMessages] = useState(new Set());
  const receivedIdsRef = useRef(new Set());

  const addMessageIfNew = (payload) => {
    if (!payload?.notification) return;

    const rawId = payload.messageId || payload.fcmMessageId;
    const msgId = rawId || Date.now().toString();

    if (receivedIdsRef.current.has(msgId)) {
      console.log("⚠️ Duplicate ignored:", msgId);
      return;
    }

    receivedIdsRef.current.add(msgId);

    const newMsg = {
      id: msgId,
      title: payload.notification.title,
      body: payload.notification.body,
      seen: false,
    };

    setMessages((prev) => [...prev, newMsg]);
  };

  useEffect(() => {
    const registerFCM = async () => {
      try {
        const token = await getToken(messaging, {
          vapidKey: vapidKey,
        });
        if (token) setFcmToken(token);
      } catch (err) {
        console.error("❌ Error getting token:", err);
      }
    };

    registerFCM();

    onMessage(messaging, (payload) => {
      console.log("📩 Foreground message:", payload);
      addMessageIfNew(payload);
    });

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        console.log("📩 Background message from SW:", event.data);
        addMessageIfNew(event.data);
      });
    }
  }, []);

  const markAsSeen = (id) => {
    setSeenMessages((prev) => new Set([...prev, id]));
  };

  const saveToken = async () => {
    if (!name || !fcmToken) {
      alert("Please enter a name and ensure token is available");
      return;
    }
    try {
      await axios.post(`${backendURL}/save-token`, {
        name,
        token: fcmToken,
      });
      alert("✅ Token saved successfully!");
    } catch (err) {
      console.error("❌ Error saving token:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center p-6">
      <div className="bg-white shadow-xl rounded-2xl w-full max-w-lg flex flex-col h-[80vh]">
        <div className="bg-indigo-600 text-white p-4 rounded-t-2xl font-bold text-lg flex justify-between items-center">
          📩 Notifications
          <span className="text-sm opacity-80">
            {name ? `Hi, ${name}` : "Guest"}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <p className="text-center text-gray-500 mt-10">
              No new messages yet...
            </p>
          ) : (
            messages.map((msg, index) => (
              <div
                key={`${msg.id}-${index}`}
                onClick={() => markAsSeen(msg.id)}
                className={`p-4 rounded-xl shadow cursor-pointer transition ${
                  seenMessages.has(msg.id)
                    ? "bg-gray-100 border border-gray-200"
                    : "bg-yellow-50 border border-yellow-300"
                }`}
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800">{msg.title}</h3>
                  {seenMessages.has(msg.id) ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-green-400" />
                  )}
                </div>
                <p className="text-gray-600 mt-1">{msg.body}</p>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 rounded-b-2xl">
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 mb-3 border rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
          />
          <button
            onClick={saveToken}
            className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
          >
            Save My Token
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
