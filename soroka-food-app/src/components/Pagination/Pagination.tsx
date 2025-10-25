import React from 'react';
import './Pagination.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    let startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`page-number ${i === currentPage ? 'active' : ''}`}
          onClick={() => onPageChange(i)}
        >
          {i}
        </button>
      );
    }

    return pages;
  };

  return (
    <div className="pagination">
      {currentPage > 1 && (
        <button
          className="page-number"
          onClick={() => onPageChange(currentPage - 1)}
        >
          Назад
        </button>
      )}

      {renderPageNumbers()}

      {currentPage < totalPages && (
        <>
          {currentPage + 2 < totalPages && <span className="page-number">...</span>}
          <button
            className="page-number"
            onClick={() => onPageChange(currentPage + 1)}
          >
            Далее
          </button>
        </>
      )}
    </div>
  );
};

export default Pagination;
