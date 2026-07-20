import { Pagination } from "@heroui/react";

/**
 * Props for CustomPagination component.
 */
type CustomPaginationProps = {
  /**
   * Controlled current page.
   */
  page?: number;
  /**
   * Total number of pages. Defaults to 1.
   */
  total?: number;
  itemsPerPage?: number;
  totalItems?: number;
  /**
   * Additional CSS classes.
   */
  className?: string;
  /**
   * Callback when page changes.
   */
  onChange?: (page: number) => void;
};

/**
 * Custom Pagination component wrapper around HeroUI Pagination.
 *
 * Example:
 * ```
 * <CustomPagination
 *   total={10}
 *   initialPage={3}
 *   onChange={(page) => console.log('Page:', page)}
 *   variant={PaginationVariant.bordered}
 * />
 * ```
 */
const CustomPagination = ({
  page = 1,
  total = 1,
  totalItems = 1,
  itemsPerPage = 1,
  ...props
}: CustomPaginationProps) => {
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (total <= 4) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (page > 3) {
        pages.push("ellipsis");
      }
      const start = Math.max(2, page - 1);
      const end = Math.min(total - 1, page + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (page < total - 2) {
        pages.push("ellipsis");
      }
      pages.push(total);
    }
    return pages;
  };
  const startItem = (page - 1) * itemsPerPage + 1;
  const endItem = Math.min(page * itemsPerPage, totalItems);

  return (
    <Pagination>
      <Pagination.Summary>
        Showing {startItem}-{endItem} of {totalItems} results
      </Pagination.Summary>
      <Pagination.Content>
        <Pagination.Item>
          <Pagination.Previous
            isDisabled={page === 1}
            onPress={() => props.onChange?.(page - 1)}
          >
            <Pagination.PreviousIcon />
            <span>Previous</span>
          </Pagination.Previous>
        </Pagination.Item>
        {getPageNumbers().map((p, i) =>
          p === "ellipsis" ? (
            <Pagination.Item key={`ellipsis-${i}`}>
              <Pagination.Ellipsis />
            </Pagination.Item>
          ) : (
            <Pagination.Item key={p}>
              <Pagination.Link
                isActive={p === page}
                onPress={() => props.onChange?.(p)}
                className={`${p === page ? "bg-primary text-primary-foreground" : ""}`}
              >
                {p}
              </Pagination.Link>
            </Pagination.Item>
          ),
        )}
        <Pagination.Item>
          <Pagination.Next
            isDisabled={page === total}
            onPress={() => props.onChange?.(page + 1)}
          >
            <span>Next</span>
            <Pagination.NextIcon />
          </Pagination.Next>
        </Pagination.Item>
      </Pagination.Content>
    </Pagination>
  );
};

export default CustomPagination;
