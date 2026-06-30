function DashboardFilters({
  section,
  setSection,
  sections,
  search,
  setSearch,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border p-5 flex gap-5 items-center">

      <select
        value={section}
        onChange={(e) => setSection(e.target.value)}
        className="border rounded-xl px-4 py-3"
      >
        <option>All</option>

        {sections.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>

      <input
        className="border rounded-xl px-4 py-3 flex-1"
        placeholder="Search Operator / Operation"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>
  );
}

export default DashboardFilters;