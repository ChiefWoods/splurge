'use client';

import { ParsedReview, ParsedProgramAccount } from '@/lib/accounts';
import { defaultFetcher } from '@/lib/api';
import { createContext, ReactNode, useContext } from 'react';
import useSWRMutation, { TriggerWithArgs } from 'swr/mutation';

interface ReviewContextType {
  allReviews: ParsedProgramAccount<ParsedReview>[] | undefined;
  review: ParsedProgramAccount<ParsedReview> | undefined;
  allReviewsMutating: boolean;
  reviewMutating: boolean;
  allReviewsError: Error | undefined;
  reviewError: Error | undefined;
  triggerAllReviews: TriggerWithArgs<
    ParsedProgramAccount<ParsedReview>[],
    any,
    string,
    { itemPda?: string }
  >;
  triggerReview: TriggerWithArgs<
    ParsedProgramAccount<ParsedReview>,
    any,
    string,
    { publicKey: string }
  >;
}

const ReviewContext = createContext<ReviewContextType>({} as ReviewContextType);

const url = '/api/accounts/reviews';

export function useReview() {
  return useContext(ReviewContext);
}

export function ReviewProvider({ children }: { children: ReactNode }) {
  const {
    data: allReviews,
    isMutating: allReviewsMutating,
    error: allReviewsError,
    trigger: triggerAllReviews,
  } = useSWRMutation(
    url,
    async (url, { arg }: { arg: { itemPda?: string } }) => {
      const { itemPda } = arg;

      const newUrl = new URL(url);

      if (itemPda) {
        newUrl.searchParams.append('item', itemPda);
      }

      return (await defaultFetcher(newUrl.href))
        .reviews as ParsedProgramAccount<ParsedReview>[];
    }
  );

  const {
    data: review,
    isMutating: reviewMutating,
    error: reviewError,
    trigger: triggerReview,
  } = useSWRMutation(
    url,
    async (url, { arg }: { arg: { publicKey: string } }) => {
      return (await defaultFetcher(`${url}?pda=${arg.publicKey}`))
        .review as ParsedProgramAccount<ParsedReview>;
    }
  );

  return (
    <ReviewContext.Provider
      value={{
        allReviews,
        review,
        allReviewsMutating,
        reviewMutating,
        allReviewsError,
        reviewError,
        triggerAllReviews,
        triggerReview,
      }}
    >
      {children}
    </ReviewContext.Provider>
  );
}
