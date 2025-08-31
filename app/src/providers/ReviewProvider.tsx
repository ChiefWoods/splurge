'use client';

import { ParsedReview } from '@/types/accounts';
import { wrappedFetch } from '@/lib/api';
import { createContext, ReactNode, useContext } from 'react';
import useSWRMutation, { TriggerWithArgs } from 'swr/mutation';

interface ReviewContextType {
  allReviewsData: ParsedReview[] | undefined;
  allReviewsIsMutating: boolean;
  allReviewsTrigger: TriggerWithArgs<
    ParsedReview[],
    any,
    string,
    {
      itemPda?: string;
    }
  >;
  reviewData: ParsedReview | undefined;
  reviewIsMutating: boolean;
  reviewTrigger: TriggerWithArgs<
    ParsedReview,
    any,
    string,
    { publicKey: string }
  >;
}

const ReviewContext = createContext<ReviewContextType>({} as ReviewContextType);

const apiEndpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/reviews`;

export function useReview() {
  return useContext(ReviewContext);
}

export function ReviewProvider({ children }: { children: ReactNode }) {
  const {
    data: allReviewsData,
    isMutating: allReviewsIsMutating,
    trigger: allReviewsTrigger,
  } = useSWRMutation(
    apiEndpoint,
    async (url, { arg }: { arg: { itemPda?: string } }) => {
      const { itemPda } = arg;

      const newUrl = new URL(url);

      if (itemPda) {
        newUrl.searchParams.append('item', itemPda);
      }

      return (await wrappedFetch(newUrl.href)).reviews as ParsedReview[];
    }
  );

  const {
    data: reviewData,
    isMutating: reviewIsMutating,
    trigger: reviewTrigger,
  } = useSWRMutation(
    apiEndpoint,
    async (url, { arg }: { arg: { publicKey: string } }) => {
      return (await wrappedFetch(`${url}?pda=${arg.publicKey}`))
        .review as ParsedReview;
    }
  );

  return (
    <ReviewContext.Provider
      value={{
        allReviewsData,
        allReviewsIsMutating,
        allReviewsTrigger,
        reviewData,
        reviewIsMutating,
        reviewTrigger,
      }}
    >
      {children}
    </ReviewContext.Provider>
  );
}
