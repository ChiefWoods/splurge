'use client';

import { ParsedReview } from '@/types/accounts';
import { wrappedFetch } from '@/lib/api';
import { createContext, ReactNode, useContext } from 'react';
import useSWRMutation, { SWRMutationResponse } from 'swr/mutation';

interface ReviewContextType {
  allReviews: SWRMutationResponse<
    ParsedReview[],
    any,
    string,
    {
      itemPda?: string;
    }
  >;
  review: SWRMutationResponse<
    ParsedReview,
    any,
    string,
    {
      publicKey: string;
    }
  >;
}

const ReviewContext = createContext<ReviewContextType>({} as ReviewContextType);

const apiEndpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/reviews`;

export function useReview() {
  return useContext(ReviewContext);
}

export function ReviewProvider({ children }: { children: ReactNode }) {
  const allReviews = useSWRMutation(
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

  const review = useSWRMutation(
    apiEndpoint,
    async (url, { arg }: { arg: { publicKey: string } }) => {
      return (await wrappedFetch(`${url}?pda=${arg.publicKey}`))
        .review as ParsedReview;
    }
  );

  return (
    <ReviewContext.Provider
      value={{
        allReviews,
        review,
      }}
    >
      {children}
    </ReviewContext.Provider>
  );
}
