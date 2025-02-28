use anchor_lang::prelude::*;

use crate::{
    constants::{ITEM_SEED, MAX_STORE_ITEM_NAME_LEN, STORE_SEED},
    error::SplurgeError,
    state::{Item, Store},
};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateItemArgs {
    pub price: u32,
    pub inventory_count: u32,
    pub name: String,
    pub image: String,
    pub description: String,
}

#[derive(Accounts)]
#[instruction(args: CreateItemArgs)]
pub struct CreateItem<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = Item::MIN_SPACE + args.name.len() + args.image.len() + args.description.len(),
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

impl CreateItem<'_> {
    pub fn validate_name(name: &str) -> Result<()> {
        require!(!name.is_empty(), SplurgeError::ItemNameRequired);
        require!(
            name.len() <= MAX_STORE_ITEM_NAME_LEN,
            SplurgeError::ItemNameTooLong
        );

        Ok(())
    }

    pub fn create_item(ctx: Context<CreateItem>, args: CreateItemArgs) -> Result<()> {
        require!(!args.image.is_empty(), SplurgeError::ItemImageRequired);

        ctx.accounts.item.set_inner(Item {
            bump: ctx.bumps.item,
            store: ctx.accounts.store.key(),
            price: args.price,
            inventory_count: args.inventory_count,
            name: args.name,
            image: args.image,
            description: args.description,
        });

        Item::invariant(&ctx.accounts.item)
    }
}
