use crate::{constants::*, state::*};
use anchor_lang::prelude::*;

pub fn update_item(
    ctx: Context<UpdateItem>,
    _name: String,
    inventory_count: i64,
    price: f64,
) -> Result<()> {
    let store_item = &mut ctx.accounts.store_item;

    store_item.inventory_count = inventory_count;
    store_item.price = price;

    Ok(())
}

#[derive(Accounts)]
#[instruction(name: String)]
pub struct UpdateItem<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [STORE_ITEM_SEED, store.key().as_ref(), name.as_bytes()],
        bump = store_item.bump,
    )]
    pub store_item: Account<'info, StoreItem>,
    #[account(
        seeds = [STORE_SEED, authority.key().as_ref()],
        bump = store.bump,
    )]
    pub store: Account<'info, Store>,
}
