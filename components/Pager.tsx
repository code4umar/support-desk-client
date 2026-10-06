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
    <div className="flex gap-3 items-center justify-center mt-6">
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="border border-line rounded-md px-4 py-2 text-sm transition-colors hover:border-brand-dark disabled:opacity-30 disabled:hover:border-line"
      >
        Previous
      </button>
      <span className="text-sm text-muted">
        Page {page} of {totalPages}
      </span>
      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="border border-line rounded-md px-4 py-2 text-sm transition-colors hover:border-brand-dark disabled:opacity-30 disabled:hover:border-line"
      >
        Next
      </button>
    </div>
  );
}