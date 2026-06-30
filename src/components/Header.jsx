import { useEffect, useState } from "react";
import { LogOut, Bell, Trash2, Moon, Sun } from "lucide-react";

const CHECKPOINTS = ["08:30", "11:00", "13:30", "16:00"];
const SHIFT_START_HOUR = 8.5;  // 8:30 AM
const SHIFT_END_HOUR = 17.0;   // 5:00 PM
const PRODUCTION_HOURS = 8;    // 8 hrs actual production (excludes 30 min lunch)

function formatCheckpointLabel(hm) {
  const [h, m] = hm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function getNotificationStorageKey() {
  return `notifications_${new Date().toDateString()}`;
}

function loadStoredNotifications() {
  try {
    const raw = localStorage.getItem(getNotificationStorageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((n) => ({ ...n, time: new Date(n.time) }));
  } catch {
    return [];
  }
}

function saveNotifications(list) {
  localStorage.setItem(getNotificationStorageKey(), JSON.stringify(list));
}

function Header({ activePage, currentUser, onLogout, darkMode, setDarkMode }) {
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const [notifications, setNotifications] = useState(() => loadStoredNotifications());

  const currentStyle = localStorage.getItem("currentStyle") || "Not Loaded";

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  function addNotification(message) {
    setNotifications((prev) => {
      const updated = [
        { id: Date.now() + Math.random(), message, time: new Date() },
        ...prev,
      ].slice(0, 20);

      saveNotifications(updated);
      return updated;
    });
  }

  // Listen for real events from other parts of the app (uploads, target applied, etc.)
  useEffect(() => {
    function handleAppNotify(e) {
      addNotification(e.detail.message);
    }
    window.addEventListener("app-notify", handleAppNotify);
    return () => window.removeEventListener("app-notify", handleAppNotify);
  }, []);

  // Production checkpoint notifications — checks ALL checkpoints up to "now"
  // every tick, so even if you were logged out when one passed, you still
  // get it (just a bit late) the next time the app is open.
  useEffect(() => {
    const target = localStorage.getItem("productionTarget");
    if (!target) return;

    const todayKey = time.toDateString();
    const nowHours = time.getHours() + time.getMinutes() / 60;

    CHECKPOINTS.forEach((checkpoint) => {
      const [ch, cm] = checkpoint.split(":").map(Number);
      const checkpointHours = ch + cm / 60;

      if (nowHours < checkpointHours) return; // hasn't happened yet today

      const firedKey = `checkpoint_${todayKey}_${checkpoint}`;
      if (localStorage.getItem(firedKey)) return; // already notified

      localStorage.setItem(firedKey, "true");

      const elapsedHours = checkpointHours - SHIFT_START_HOUR;
      const totalShiftHours = PRODUCTION_HOURS;
      const expectedPieces = Math.round(
        (Number(target) / totalShiftHours) * elapsedHours
      );

      addNotification(
        `By ${formatCheckpointLabel(checkpoint)}, you should have completed approximately ${expectedPieces} pieces (target: ${target}/day).`
      );
    });
  }, [time]);

  function clearNotifications() {
    setNotifications([]);
    saveNotifications([]);
    setOpen(false);
  }

  return (
    <header className="bg-white/90 backdrop-blur border-b px-8 py-4 flex justify-between items-center sticky top-0 z-10">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">{activePage}</h2>
        <p className="text-sm text-slate-500">
          {time.toLocaleDateString()} · {time.toLocaleTimeString()} · Raymond Silver Spark
        </p>
        <p className="text-sm text-blue-700 font-semibold">
          Current Style: {currentStyle}
        </p>
      </div>

      <div className="flex items-center gap-5">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="bg-slate-100 hover:bg-slate-200 p-3 rounded-xl"
        >
          {darkMode ? <Sun size={22} /> : <Moon size={22} />}
        </button>

        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="relative bg-slate-100 hover:bg-slate-200 p-3 rounded-xl"
          >
            <Bell size={22} />

            {notifications.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 mt-3 w-96 bg-white border rounded-2xl shadow-xl p-5 z-50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Notifications</h3>

                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="flex items-center gap-2 text-sm text-red-600 hover:underline"
                  >
                    <Trash2 size={16} />
                    Clear
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <p className="text-slate-500 text-sm">No new notifications.</p>
              ) : (
                <div className="space-y-3">
                  {notifications.map((note) => (
                    <div
                      key={note.id}
                      className="bg-slate-50 border rounded-xl p-3 text-sm"
                    >
                      <p className="font-medium text-slate-800">{note.message}</p>
                      <p className="text-slate-500 text-xs mt-1">
                        {note.time.toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="text-right">
          <p className="font-semibold text-slate-900">
            {currentUser?.name || currentUser?.email || "User"}
          </p>
          <p className="text-sm text-slate-500">
            {currentUser?.role || "Line Supervisor"}
          </p>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </header>
  );
}

export default Header;