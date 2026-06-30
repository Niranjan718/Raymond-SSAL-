function MetricCard({ title, value }) {
  return (
    <div style={{
      backgroundColor: "white",
      borderRadius: "20px",
      padding: "24px",
      border: "1px solid #E2E8F0",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    }}>
      <p style={{
        fontSize: "11px",
        fontWeight: 700,
        color: "#94A3B8",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        margin: 0,
      }}>
        {title}
      </p>

      <div style={{
        marginTop: "16px",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
      }}>
        <h3 style={{
          fontSize: "36px",
          fontWeight: 900,
          color: "#0F172A",
          lineHeight: 1,
          margin: 0,
        }}>
          {value}
        </h3>

        <span style={{
          fontSize: "11px",
          fontWeight: 700,
          color: "#16A34A",
          backgroundColor: "#F0FDF4",
          padding: "4px 10px",
          borderRadius: "20px",
          border: "1px solid #BBF7D0",
        }}>
          Live
        </span>
      </div>
    </div>
  );
}

export default MetricCard;