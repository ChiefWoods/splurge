use crate::{constants::*, error::SplurgeError, state::*};
use anchor_lang::prelude::*;

pub fn update_store(
    ctx: Context<UpdateStore>,
    name: String,
    image: String,
    about: String,
) -> Result<()> {
    require!(!name.is_empty(), SplurgeError::StoreNameRequired);
    require!(
        name.len() <= MAX_STORE_NAME_LEN,
        SplurgeError::StoreNameTooLong
    );
    require!(!image.is_empty(), SplurgeError::StoreImageRequired);

    let store = &mut ctx.accounts.store;

    store.name = name;
    store.image = image;
    store.about = about;

    Ok(())
}

#[derive(Accounts)]
#[instruction(name: String, image: String, about: String)]
pub struct UpdateStore<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        realloc = Store::MIN_SPACE + name.len() + image.len() + about.len() + store.get_items_space(),
        realloc::payer = authority,
        realloc::zero = false,
        seeds = [STORE_SEED, authority.key().as_ref()],
        bump = store.bump,
    )]
    pub store: Account<'info, Store>,
    pub system_program: Program<'info, System>,
}
