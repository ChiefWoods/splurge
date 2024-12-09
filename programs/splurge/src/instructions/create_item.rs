use crate::{constants::*, error::ErrorCode, state::*};
use anchor_lang::{prelude::*, solana_program::pubkey::PUBKEY_BYTES};

pub fn create_item(
    ctx: Context<CreateItem>,
    name: String,
    image: String,
    description: String,
    inventory_count: i64,
    price: f64,
) -> Result<()> {
    require!(!name.is_empty(), ErrorCode::StoreItemNameRequired);
    require!(
        name.len() <= MAX_STORE_ITEM_NAME_LEN,
        ErrorCode::StoreItemNameTooLong
    );
    require!(!image.is_empty(), ErrorCode::StoreItemImageRequired);

    let store_item = &mut ctx.accounts.store_item;

    store_item.bump = ctx.bumps.store_item;
    store_item.inventory_count = inventory_count;
    store_item.price = price;
    store_item.store = ctx.accounts.store.key();
    store_item.name = name;
    store_item.image = image;
    store_item.description = description;
    store_item.reviews = Vec::new();

    let store = &mut ctx.accounts.store;

    store.items.push(store_item.key());

    Ok(())
}

#[derive(Accounts)]
#[instruction(name: String, image: String, description: String)]
pub struct CreateItem<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
      init,
      space = StoreItem::MIN_SPACE + name.len() + image.len() + description.len(),
      seeds = [STORE_ITEM_SEED, store.key().as_ref(), name.as_bytes()],
      bump,
      payer = authority,
    )]
    pub store_item: Account<'info, StoreItem>,
    #[account(
      mut,
      realloc = store.to_account_info().data_len() + PUBKEY_BYTES,
      realloc::payer = authority,
      realloc::zero = false,
      seeds = [STORE_SEED, authority.key().as_ref()],
      bump = store.bump,
    )]
    pub store: Account<'info, Store>,
    pub system_program: Program<'info, System>,
}
