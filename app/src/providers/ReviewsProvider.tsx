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
  itemPda,
}: {
  children: ReactNode;
  itemPda: string;
}) {
  const {
    data: reviewsData,
    isLoading: reviewsLoading,
    mutate: reviewsMutate,
  } = useSWR({ apiEndpoint, itemPda }, async ({ apiEndpoint, itemPda }) => {
    const newUrl = new URL(apiEndpoint);

    newUrl.searchParams.append('item', itemPda);

    return (await wrappedFetch(newUrl.href)).reviews as ParsedReview[];
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
