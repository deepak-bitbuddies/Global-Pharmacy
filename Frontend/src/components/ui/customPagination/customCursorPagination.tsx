import { Pagination } from "@heroui/react";

/**
 * Pagination controls for keyset/cursor-paginated data — Previous/Next only,
 * no clickable numbered page list (a cursor can't jump to an arbitrary
 * unvisited page). Sibling to `CustomPagination`, which is for data that's
 * already fully loaded client-side and supports true random-access paging.
 */
type CustomCursorPaginationProps = {
  page: number;
  totalPages?: number;
  totalItems?: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onNext: () => void;
  onPrevious: () => void;
  className?: string;
};

const CustomCursorPagination = ({
  page,
  totalPages,
  totalItems = 0,
  itemsPerPage,
  hasNextPage,
  hasPreviousPage,
  onNext,
  onPrevious,
  className,
}: CustomCursorPaginationProps) => {
  const startItem = totalItems === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const endItem = Math.min(page * itemsPerPage, totalItems);

  return (
    <Pagination className={className}>
      <Pagination.Summary>
        Showing {startItem}-{endItem} of {totalItems} results
      </Pagination.Summary>
      <Pagination.Content>
        <Pagination.Item>
          <Pagination.Previous isDisabled={!hasPreviousPage} onPress={onPrevious}>
            <Pagination.PreviousIcon />
            <span>Previous</span>
          </Pagination.Previous>
        </Pagination.Item>
        <Pagination.Item>
          <span className="px-2 text-sm text-muted-foreground">
            Page {page}
            {totalPages ? ` of ${totalPages}` : ""}
          </span>
        </Pagination.Item>
        <Pagination.Item>
          <Pagination.Next isDisabled={!hasNextPage} onPress={onNext}>
            <span>Next</span>
            <Pagination.NextIcon />
          </Pagination.Next>
        </Pagination.Item>
      </Pagination.Content>
    </Pagination>
  );
};

export default CustomCursorPagination;
