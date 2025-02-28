use anchor_lang::prelude::*;

use crate::{
    constants::ITEM_SEED,
    state::{Item, Store},
};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateItemArgs {
    pub price: Option<u32>,
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
    pub fn update_item(ctx: Context<UpdateItem>, args: UpdateItemArgs) -> Result<()> {
        if let Some(price) = args.price {
            ctx.accounts.item.price = price;
        };

        if let Some(inventory_count) = args.inventory_count {
            ctx.accounts.item.inventory_count = inventory_count;
        };

        Ok(())
    }
}
