use crate::{constants::*, state::*};
use anchor_lang::{prelude::*, solana_program::pubkey::PUBKEY_BYTES};

pub fn delete_item(ctx: Context<DeleteItem>, _name: String) -> Result<()> {
    ctx.accounts
        .store
        .items
        .retain(|item| item != &ctx.accounts.store_item.key());

    Ok(())
}

#[derive(Accounts)]
#[instruction(name: String)]
pub struct DeleteItem<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        close = authority,
        seeds = [STORE_ITEM_SEED, store.key().as_ref(), name.as_bytes()],
        bump = store_item.bump,
    )]
    pub store_item: Account<'info, StoreItem>,
    #[account(
        mut,
        realloc = store.to_account_info().data_len() - PUBKEY_BYTES,
        realloc::payer = authority,
        realloc::zero = false,
        seeds = [STORE_SEED, authority.key().as_ref()],
        bump = store.bump,
    )]
    pub store: Account<'info, Store>,
    pub system_program: Program<'info, System>,
}
