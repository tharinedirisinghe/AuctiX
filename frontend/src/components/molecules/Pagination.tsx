import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useEffect } from 'react';

export function PaginationNav({
  handlePage,
  pages,
  currentPage,
}: {
  handlePage: (page: number) => void;
  pages: number;
  currentPage: number; // 0-based
}) {
  // Helper to go to a page (0-based)
  const goToPage = (page: number) => {
    if (page >= 0 && page < pages) {
      handlePage(page);
    }
  };

  const handlePreviousClick = () => {
    goToPage(currentPage - 1);
  };

  const handleNextClick = () => {
    goToPage(currentPage + 1);
  };

  useEffect(() => {
    console.log('PaginationNav debug:', { currentPage, pages });
  }, [currentPage, pages]);

  // Display logic: show 1-based page numbers
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={handlePreviousClick}
            className={
              currentPage === 0
                ? 'pointer-events-none opacity-70 cursor-not-allowed'
                : 'cursor-pointer'
            }
          />
        </PaginationItem>

        {currentPage > 1 && (
          <>
            <PaginationItem>
              <PaginationLink onClick={() => goToPage(0)}>1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          </>
        )}

        {currentPage > 0 && (
          <PaginationItem>
            <PaginationLink onClick={() => goToPage(currentPage - 1)}>
              {currentPage}
            </PaginationLink>
          </PaginationItem>
        )}

        <PaginationItem>
          <PaginationLink isActive={true}>{currentPage + 1}</PaginationLink>
        </PaginationItem>

        {pages > currentPage + 1 && (
          <PaginationItem>
            <PaginationLink onClick={() => goToPage(currentPage + 1)}>
              {currentPage + 2}
            </PaginationLink>
          </PaginationItem>
        )}

        {currentPage < pages - 2 && (
          <>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink onClick={() => goToPage(pages - 1)}>
                {pages}
              </PaginationLink>
            </PaginationItem>
          </>
        )}

        <PaginationItem>
          <PaginationNext
            onClick={handleNextClick}
            className={
              currentPage >= pages - 1
                ? 'pointer-events-none opacity-70 cursor-not-allowed'
                : 'cursor-pointer'
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
