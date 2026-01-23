"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from "lucide-react";

const MAX_PAGE_BUTTONS = 5;

const getVisiblePages = (currentPage: number, totalPages: number) => {
  const pages: number[] = [];
  if (totalPages <= MAX_PAGE_BUTTONS) {
    for (let page = 1; page <= totalPages; page += 1) {
      pages.push(page);
    }
    return pages;
  }

  const half = Math.floor(MAX_PAGE_BUTTONS / 2);
  let start = Math.max(1, currentPage - half);
  let end = start + MAX_PAGE_BUTTONS - 1;
  if (end > totalPages) {
    end = totalPages;
    start = Math.max(1, end - MAX_PAGE_BUTTONS + 1);
  }

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  return pages;
};

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
};

type PaginationRootProps = React.ComponentProps<"nav">;

const PaginationRoot = ({ className, ...props }: PaginationRootProps) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
);

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
));
PaginationContent.displayName = "PaginationContent";

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
));
PaginationItem.displayName = "PaginationItem";

type PaginationLinkProps = {
  isActive?: boolean;
  size?: "default" | "icon";
} & React.ComponentProps<"a">;

const PaginationLink = React.forwardRef<HTMLAnchorElement, PaginationLinkProps>(
  ({ className, isActive, size = "icon", ...props }, ref) => (
    <a
      ref={ref}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        buttonVariants({ variant: isActive ? "outline" : "ghost", size }),
        isActive
          ? "bg-white text-slate-900 hover:bg-white"
          : "text-slate-200 hover:bg-white/10 hover:text-white",
        className
      )}
      {...props}
    />
  )
);
PaginationLink.displayName = "PaginationLink";

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    className={cn("gap-1 pl-2.5", className)}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
);
PaginationPrevious.displayName = "PaginationPrevious";

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    className={cn("gap-1 pr-2.5", className)}
    {...props}
  >
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
);
PaginationNext.displayName = "PaginationNext";

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn(
      "flex h-9 w-9 items-center justify-center text-slate-300",
      className
    )}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
);

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const visiblePages = getVisiblePages(currentPage, totalPages);

  const handlePageChange = (page: number) => {
    if (page === currentPage) return;
    onPageChange(page);
  };

  const atFirst = currentPage === 1;
  const atLast = currentPage === totalPages;

  const showLeadingEllipsis = visiblePages[0] > 2;
  const showTrailingEllipsis =
    visiblePages[visiblePages.length - 1] < totalPages - 1;
  const showFirstPage = visiblePages[0] > 1;
  const showLastPage = visiblePages[visiblePages.length - 1] < totalPages;

  return (
    <PaginationRoot>
      <PaginationContent className={cn("w-full justify-between", className)}>
        <PaginationItem>
          <PaginationLink
            size="icon"
            onClick={() => handlePageChange(1)}
            aria-label="First page"
            className={atFirst ? "pointer-events-none opacity-50" : undefined}
          >
            <ChevronsLeft className="h-4 w-4" />
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => handlePageChange(currentPage - 1)}
            className={atFirst ? "pointer-events-none opacity-50" : undefined}
          />
        </PaginationItem>
        <PaginationItem>
          <div className="flex items-center gap-1">
            {showFirstPage && (
              <PaginationLink
                onClick={() => handlePageChange(1)}
                isActive={currentPage === 1}
              >
                1
              </PaginationLink>
            )}
            {showLeadingEllipsis && <PaginationEllipsis />}
            {visiblePages.map((page) => (
              <PaginationLink
                key={page}
                onClick={() => handlePageChange(page)}
                isActive={page === currentPage}
              >
                {page}
              </PaginationLink>
            ))}
            {showTrailingEllipsis && <PaginationEllipsis />}
            {showLastPage && (
              <PaginationLink
                onClick={() => handlePageChange(totalPages)}
                isActive={currentPage === totalPages}
              >
                {totalPages}
              </PaginationLink>
            )}
          </div>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext
            onClick={() => handlePageChange(currentPage + 1)}
            className={atLast ? "pointer-events-none opacity-50" : undefined}
          />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink
            size="icon"
            onClick={() => handlePageChange(totalPages)}
            aria-label="Last page"
            className={atLast ? "pointer-events-none opacity-50" : undefined}
          >
            <ChevronsRight className="h-4 w-4" />
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </PaginationRoot>
  );
}
