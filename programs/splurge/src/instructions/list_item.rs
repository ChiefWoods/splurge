use anchor_lang::prelude::*;

use crate::{
    constants::{ITEM_SEED, MAX_ITEM_NAME_LEN, STORE_SEED},
    error::SplurgeError,
    events::ItemListed,
    state::{Item, Store},
};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct ListItemArgs {
    pub price: u64,
    pub inventory_count: u32,
    pub name: String,
    pub image: String,
    pub description: String,
}

#[derive(Accounts)]
#[instruction(args: ListItemArgs)]
pub struct ListItem<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = Item::space(&args.name, &args.image, &args.description),
        seeds = [ITEM_SEED, store.key().as_ref(), args.name.as_bytes()],
        bump,
    )]
    pub item: Account<'info, Item>,
    #[account(
        seeds = [STORE_SEED, authority.key().as_ref()],
        bump = store.bump,
        has_one = authority,
    )]
    pub store: Account<'info, Store>,
    pub system_program: Program<'info, System>,
}

impl ListItem<'_> {
    pub fn handler(ctx: Context<ListItem>, args: ListItemArgs) -> Result<()> {
        let ListItemArgs {
            price,
            inventory_count,
            name,
            image,
            description,
        } = args;

        require!(!name.is_empty(), SplurgeError::ItemNameRequired);
        require!(
            name.len() <= MAX_ITEM_NAME_LEN as usize,
            SplurgeError::ItemNameTooLong
        );

        let ListItem { item, store, .. } = ctx.accounts;

        item.set_inner(Item {
            bump: ctx.bumps.item,
            store: store.key(),
            price,
            inventory_count,
            name,
            image,
            description,
        });

        emit!(ItemListed {
            item: item.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        Item::invariant(&item)
    }
}
