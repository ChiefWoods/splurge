"use client";

import { createContext, ReactNode, use, useMemo } from "react";
import useSWR, { KeyedMutator } from "swr";

import { wrappedFetch } from "@/lib/api";
import { ParsedReview } from "@/types/accounts";

interface ReviewsContextType {
  reviewsData: ParsedReview[] | undefined;
  reviewsLoading: boolean;
  reviewsMutate: KeyedMutator<ParsedReview[]>;
}

const ReviewsContext = createContext<ReviewsContextType>({} as ReviewsContextType);

const apiEndpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/reviews`;

export function useReviews() {
  return use(ReviewsContext);
}

export function ReviewsProvider({
  children,
  item,
  fallbackData,
}: {
  children: ReactNode;
  item: string;
  fallbackData: ParsedReview[];
}) {
  const {
    data: reviewsData,
    isLoading: reviewsLoading,
    mutate: reviewsMutate,
  } = useSWR(
    "reviews",
    async () => {
      const url = new URL(apiEndpoint);

      if (item) url.searchParams.append("item", item);

      const reviews = (await wrappedFetch(url.href)).reviews as ParsedReview[];

      return reviews;
    },
    {
      fallbackData,
      revalidateOnMount: false,
    },
  );
  const value = useMemo(
    () => ({
      reviewsData,
      reviewsLoading,
      reviewsMutate,
    }),
    [reviewsData, reviewsLoading, reviewsMutate],
  );

  return <ReviewsContext.Provider value={value}>{children}</ReviewsContext.Provider>;
}
