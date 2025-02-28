use anchor_lang::prelude::*;

use crate::{
    constants::{ORDER_SEED, REVIEW_SEED},
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
        has_one = authority,
    )]
    pub shopper: Account<'info, Shopper>,
    #[account(
        seeds = [ORDER_SEED, shopper.key().as_ref(), order.item.key().as_ref(), order.timestamp.to_le_bytes().as_ref()],
        bump = order.bump,
    )]
    pub order: Account<'info, Order>,
    #[account(
        init,
        payer = authority,
        space = Review::MIN_SPACE + args.text.len(),
        seeds = [REVIEW_SEED, order.key().as_ref()],
        bump,
    )]
    pub review: Account<'info, Review>,
    pub system_program: Program<'info, System>,
}

impl CreateReview<'_> {
    pub fn create_review(ctx: Context<CreateReview>, args: CreateReviewArgs) -> Result<()> {
        require!(
            ctx.accounts.order.status == OrderStatus::Completed,
            SplurgeError::OrderNotCompleted
        );

        require!(
            args.rating >= 1 && args.rating <= 5,
            SplurgeError::InvalidRating
        );

        ctx.accounts.review.set_inner(Review {
            bump: ctx.bumps.review,
            order: ctx.accounts.order.key(),
            rating: args.rating,
            timestamp: Clock::get()?.unix_timestamp,
            text: args.text,
        });

        Review::invariant(&ctx.accounts.review)
    }
}
