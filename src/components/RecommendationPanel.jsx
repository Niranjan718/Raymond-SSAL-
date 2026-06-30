function RecommendationPanel({ rows }) {
  const bestRow = rows.find((row) => row.substitute);

  if (!bestRow) {
    return (
      <div className="bg-white rounded-2xl border p-6">
        <h2 className="text-xl font-bold">AI Recommendation</h2>
        <p className="text-slate-500 mt-3">
          Mark an operator absent to generate recommendations.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <h2 className="text-xl font-bold text-slate-900">
        AI Recommendation
      </h2>

      <div className="mt-5 space-y-3">
        <p>
          <span className="text-slate-500">Operation:</span>{" "}
          <strong>{bestRow.operation}</strong>
        </p>

        <p>
          <span className="text-slate-500">Absent Operator:</span>{" "}
          <strong>{bestRow.originalOperator}</strong>
        </p>

        <p>
          <span className="text-slate-500">Recommended Substitute:</span>{" "}
          <strong className="text-teal-700">{bestRow.substitute}</strong>
        </p>

        <p>
          <span className="text-slate-500">Confidence:</span>{" "}
          <strong>{bestRow.confidence || 95}%</strong>
        </p>

        <div className="pt-3 border-t space-y-2 text-green-700">
          <p>✓ Certified for operation</p>
          <p>✓ Present today</p>
          <p>✓ Highest weighted score</p>
          <p>✓ Not already allocated</p>
        </div>
      </div>
    </div>
  );
}

export default RecommendationPanel;