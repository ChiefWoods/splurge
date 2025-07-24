use anchor_lang::prelude::*;

use crate::{
    constants::{ORDER_SEED, REVIEW_SEED, SHOPPER_SEED},
    error::SplurgeError,
    state::{Order, OrderStatus, Review, Shopper},
};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateReviewArgs {
    pub text: String,
    pub rating: u8,
}

#[derive(Accounts)]
#[instruction(args: CreateReviewArgs)]
pub struct CreateReview<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        seeds = [SHOPPER_SEED, authority.key().as_ref()],
        bump = shopper.bump,
    )]
    pub shopper: Account<'info, Shopper>,
    #[account(
        seeds = [ORDER_SEED, shopper.key().as_ref(), order.item.key().as_ref(), order.timestamp.to_le_bytes().as_ref()],
        bump = order.bump,
        constraint = order.status == OrderStatus::Completed @ SplurgeError::OrderNotCompleted,
    )]
    pub order: Account<'info, Order>,
    #[account(
        init,
        payer = authority,
        space = Review::space(&args.text),
        seeds = [REVIEW_SEED, order.key().as_ref()],
        bump,
    )]
    pub review: Account<'info, Review>,
    pub system_program: Program<'info, System>,
}

impl CreateReview<'_> {
    pub fn handler(ctx: Context<CreateReview>, args: CreateReviewArgs) -> Result<()> {
        let CreateReviewArgs { text, rating } = args;

        require!(rating >= 1 && rating <= 5, SplurgeError::InvalidRating);

        let review = &mut ctx.accounts.review;

        review.set_inner(Review {
            bump: ctx.bumps.review,
            order: ctx.accounts.order.key(),
            rating,
            timestamp: Clock::get()?.unix_timestamp,
            text,
        });

        Review::invariant(&review)
    }
}
