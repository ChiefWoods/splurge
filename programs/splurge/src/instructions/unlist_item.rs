use anchor_lang::prelude::*;

use crate::{
    constants::ITEM_SEED,
    state::{Item, Store},
};

#[derive(Accounts)]
pub struct UnlistItem<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        close = authority,
        seeds = [ITEM_SEED, store.key().as_ref(), item.name.as_bytes()],
        bump = item.bump,
    )]
    pub item: Account<'info, Item>,
    #[account(
        has_one = authority,
    )]
    pub store: Account<'info, Store>,
    pub system_program: Program<'info, System>,
}

impl UnlistItem<'_> {
    pub fn handler(_ctx: Context<UnlistItem>) -> Result<()> {
        Ok(())
    }
}
