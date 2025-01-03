use crate::{constants::*, error::SplurgeError, state::*};
use anchor_lang::{prelude::*, solana_program::pubkey::PUBKEY_BYTES};

pub fn create_review(ctx: Context<CreateReview>, text: String, rating: i8) -> Result<()> {
    require!(
        ctx.accounts.order.status == OrderStatus::Completed,
        SplurgeError::OrderNotCompleted
    );
    require!(
        rating >= 1 && rating <= 5,
        SplurgeError::ReviewRatingInvalid
    );

    let store_item = &mut ctx.accounts.store_item;

    require!(
        !store_item.reviews.contains(&ctx.accounts.review.key()),
        SplurgeError::ReviewForOrderAlreadyExists
    );

    let review = &mut ctx.accounts.review;

    review.bump = ctx.bumps.review;
    review.rating = rating;
    review.timestamp = Clock::get()?.unix_timestamp;
    review.order = ctx.accounts.order.to_account_info().key();
    review.text = text;

    store_item.reviews.push(review.key());

    Ok(())
}

#[derive(Accounts)]
#[instruction(text: String)]
pub struct CreateReview<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        seeds = [SHOPPER_SEED, authority.key().as_ref()],
        bump = shopper.bump,
    )]
    pub shopper: Account<'info, Shopper>,
    #[account(
        mut,
        realloc = store_item.to_account_info().data_len() + PUBKEY_BYTES,
        realloc::payer = authority,
        realloc::zero = false,
    )]
    pub store_item: Account<'info, StoreItem>,
    pub order: Account<'info, Order>,
    #[account(
        init,
        payer = authority,
        space = Review::MIN_SPACE + text.len(),
        seeds = [REVIEW_SEED, order.key().as_ref()],
        bump,
    )]
    pub review: Account<'info, Review>,
    pub system_program: Program<'info, System>,
}
