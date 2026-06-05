export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const getPages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    const pages = []
    const left = Math.max(2, currentPage - 2)
    const right = Math.min(totalPages - 1, currentPage + 2)

    pages.push(1)

    if (left > 2) pages.push('...')

    for (let i = left; i <= right; i++) pages.push(i)

    if (right < totalPages - 1) pages.push('...')

    pages.push(totalPages)

    return pages
  }

  const pages = getPages()

  return (
    <div className="flex items-center justify-center gap-1.5 mt-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="px-3 py-1.5 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        Previous
      </button>
      {pages.map((p, idx) =>
        p === '...' ? (
          <span key={`ellipsis-${idx}`} className="px-1 text-gray-300 text-sm dark:text-gray-500">...</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 text-sm rounded-xl font-medium transition-colors ${
              currentPage === p
                ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="px-3 py-1.5 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        Next
      </button>
    </div>
  )
}
