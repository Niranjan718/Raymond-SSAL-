function UploadSummary({ info }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">

      <h2 className="text-2xl font-bold">
        Current Upload
      </h2>

      <div className="grid grid-cols-4 gap-6 mt-6">

        <div>

          <div className="text-slate-500">
            Style
          </div>

          <div className="font-bold">
            {info.styleName}
          </div>

        </div>

        <div>

          <div className="text-slate-500">
            Product
          </div>

          <div className="font-bold">
            {info.product}
          </div>

        </div>

        <div>

          <div className="text-slate-500">
            Operators
          </div>

          <div className="font-bold">
            {info.operators}
          </div>

        </div>

        <div>

          <div className="text-slate-500">
            Operations
          </div>

          <div className="font-bold">
            {info.operations}
          </div>

        </div>

      </div>
    </div>
  );
}

export default UploadSummary;