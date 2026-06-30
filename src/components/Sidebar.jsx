import logo from "../assets/logo.jpg";
import {
  LayoutDashboard,
  Upload,
  Users,
  Database,
  BarChart3,
  FileText,
} from "lucide-react";

function Sidebar({ activePage, setActivePage }) {
  const menu = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Upload Center", icon: Upload },
    { name: "Attendance", icon: Users },
    { name: "Analytics", icon: BarChart3 },
    { name: "Reports", icon: FileText },
    { name: "Settings", icon: Database },
  ];

  return (
    <aside style={{
      width: "256px",
      minWidth: "256px",
      minHeight: "100vh",
      backgroundColor: "#001B3A",
      color: "white",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
    }}>
      <div style={{ padding: "24px" }}>
        <div style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "12px",
          marginBottom: "24px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        }}>
          <img
            src={logo}
            alt="Silver Spark Logo"
            style={{ width: "100%", height: "80px", objectFit: "contain" }}
          />
        </div>

        <h2 style={{ fontSize: "18px", fontWeight: 800, color: "white", lineHeight: 1.3 }}>
          Raymond Silver Spark
        </h2>
        <p style={{ fontSize: "13px", color: "#94A3B8", marginTop: "4px" }}>
          Smart Allocation System
        </p>
      </div>

      <nav style={{ flex: 1, padding: "0 16px" }}>
        {menu.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.name;

          return (
            <button
              key={item.name}
              onClick={() => setActivePage(item.name)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                borderRadius: "12px",
                marginBottom: "4px",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 600,
                fontFamily: "inherit",
                backgroundColor: isActive ? "#14B8A6" : "transparent",
                color: isActive ? "white" : "#94A3B8",
                transition: "all 0.2s",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "#1E3A5F";
                  e.currentTarget.style.color = "white";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#94A3B8";
                }
              }}
            >
              <Icon size={19} />
              {item.name}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;