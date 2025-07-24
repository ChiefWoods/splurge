use anchor_lang::prelude::*;

use crate::{
    constants::ITEM_SEED,
    state::{Item, Store},
};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateItemArgs {
    pub price: Option<u64>,
    pub inventory_count: Option<u32>,
}

#[derive(Accounts)]
pub struct UpdateItem<'info> {
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [ITEM_SEED, store.key().as_ref(), item.name.as_bytes()],
        bump = item.bump,
    )]
    pub item: Account<'info, Item>,
    #[account(
        has_one = authority,
    )]
    pub store: Account<'info, Store>,
}

impl UpdateItem<'_> {
    pub fn handler(ctx: Context<UpdateItem>, args: UpdateItemArgs) -> Result<()> {
        let UpdateItemArgs {
            price,
            inventory_count,
        } = args;

        let item = &mut ctx.accounts.item;

        if let Some(price) = price {
            item.price = price;
        };

        if let Some(inventory_count) = inventory_count {
            item.inventory_count = inventory_count;
        };

        Item::invariant(&item)
    }
}
