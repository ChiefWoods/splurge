'use client';

import { ParsedReview } from '@/types/accounts';
import { wrappedFetch } from '@/lib/api';
import { createContext, ReactNode, useContext } from 'react';
import useSWR, { KeyedMutator } from 'swr';

interface ReviewsContextType {
  reviewsData: ParsedReview[] | undefined;
  reviewsLoading: boolean;
  reviewsMutate: KeyedMutator<ParsedReview[]>;
}

const ReviewsContext = createContext<ReviewsContextType>(
  {} as ReviewsContextType
);

const apiEndpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/reviews`;

export function useReviews() {
  return useContext(ReviewsContext);
}

export function ReviewsProvider({
  children,
  item,
}: {
  children: ReactNode;
  item: string;
}) {
  const {
    data: reviewsData,
    isLoading: reviewsLoading,
    mutate: reviewsMutate,
  } = useSWR('reviews', async () => {
    const url = new URL(apiEndpoint);

    if (item) url.searchParams.append('item', item);

    const reviews = (await wrappedFetch(url.href)).reviews as ParsedReview[];

    return reviews;
  });

  return (
    <ReviewsContext.Provider
      value={{
        reviewsData,
        reviewsLoading,
        reviewsMutate,
      }}
    >
      {children}
    </ReviewsContext.Provider>
  );
}
