export default function Pager({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex gap-2 items-center mt-4">
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="border px-3 py-1 disabled:opacity-40"
      >
        Previous
      </button>
      <span>
        Page {page} of {totalPages}
      </span>
      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="border px-3 py-1 disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}