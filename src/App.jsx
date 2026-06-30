import { useState, useMemo } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import UploadCenter from "./pages/UploadCenter";
import Attendance from "./pages/Attendance";
import Settings from "./pages/Settings";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import { STORAGE_KEYS } from "./utils/constants";
import { autoAssignOperators } from "./utils/autoAssignment";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activePage, setActivePage] = useState("Dashboard");
  const [darkMode, setDarkMode] = useState(false);

  const [skillMatrix, setSkillMatrix] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SKILL_MATRIX);
    return saved ? JSON.parse(saved) : [];
  });

  const [operationBulletin, setOperationBulletin] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.OPERATION_BULLETIN);
    return saved ? JSON.parse(saved) : [];
  });

  const [attendance, setAttendance] = useState(() => {
    const saved = localStorage.getItem("attendance");
    return saved ? JSON.parse(saved) : {};
  });

  const [operatorAssignments, setOperatorAssignments] = useState(() => {
    const saved = localStorage.getItem("operatorAssignments");
    return saved ? JSON.parse(saved) : {};
  });

  const [criticalityMap, setCriticalityMap] = useState(() => {
    const saved = localStorage.getItem("criticalityMap");
    return saved ? JSON.parse(saved) : {};
  });

  const [skillPool, setSkillPool] = useState(() => {
    const saved = localStorage.getItem("skillPool");
    return saved ? JSON.parse(saved) : [];
  });

  const [skillPoolAttendance, setSkillPoolAttendance] = useState(() => {
    const saved = localStorage.getItem("skillPoolAttendance");
    return saved ? JSON.parse(saved) : {};
  });

  const operationBulletinWithAssignments = useMemo(() => {
    return autoAssignOperators(operationBulletin, skillMatrix);
  }, [operationBulletin, skillMatrix]);

  const operationBulletinWithCriticality = operationBulletinWithAssignments.map((row) => ({
    ...row,
    criticality: criticalityMap[row.operation] || "Easy",
  }));

  function handleLogin(user) {
    setCurrentUser(user);
    setIsLoggedIn(true);
    setActivePage("Dashboard");
  }

  function handleLogout() {
    setCurrentUser(null);
    setIsLoggedIn(false);
    setActivePage("Dashboard");
  }

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className={`min-h-screen flex ${darkMode ? "dark-mode" : "bg-slate-100"}`}>
      <Sidebar activePage={activePage} setActivePage={setActivePage} />

      <main className="flex-1">
        <Header
          activePage={activePage}
          currentUser={currentUser}
          onLogout={handleLogout}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        <div className="p-8">
          {activePage === "Dashboard" && (
            <Dashboard
              skillMatrix={skillMatrix}
              operationBulletin={operationBulletinWithCriticality}
              attendance={attendance}
              operatorAssignments={operatorAssignments}
              currentUser={currentUser}
              skillPool={skillPool}
              skillPoolAttendance={skillPoolAttendance}
            />
          )}

          {activePage === "Upload Center" && (
            <UploadCenter
              setSkillMatrix={setSkillMatrix}
              setOperationBulletin={setOperationBulletin}
              operationBulletin={operationBulletin}
              criticalityMap={criticalityMap}
              setCriticalityMap={setCriticalityMap}
              skillPool={skillPool}
              setSkillPool={setSkillPool}
            />
          )}

          {activePage === "Attendance" && (
            <Attendance
              skillMatrix={skillMatrix}
              operationBulletin={operationBulletinWithCriticality}
              attendance={attendance}
              setAttendance={setAttendance}
              setOperatorAssignments={setOperatorAssignments}
              setActivePage={setActivePage}
              skillPool={skillPool}
              skillPoolAttendance={skillPoolAttendance}
              setSkillPoolAttendance={setSkillPoolAttendance}
            />
          )}

          {activePage === "Analytics" && (
            <Analytics
              skillMatrix={skillMatrix}
              operationBulletin={operationBulletinWithCriticality}
              attendance={attendance}
            />
          )}

          {activePage === "Reports" && (
            <Reports
              skillMatrix={skillMatrix}
              operationBulletin={operationBulletinWithCriticality}
              attendance={attendance}
              operatorAssignments={operatorAssignments}
            />
          )}

          {activePage === "Settings" && (
            <Settings
              skillMatrix={skillMatrix}
              operationBulletin={operationBulletinWithCriticality}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;