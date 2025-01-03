use crate::{constants::*, error::SplurgeError, state::*};
use anchor_lang::prelude::*;

pub fn create_store(
    ctx: Context<CreateStore>,
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

    store.bump = ctx.bumps.store;
    store.name = name;
    store.image = image;
    store.about = about;
    store.items = Vec::new();

    Ok(())
}

#[derive(Accounts)]
#[instruction(name: String, image: String, about: String)]
pub struct CreateStore<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = Store::MIN_SPACE + name.len() + image.len() + about.len(),
        seeds = [STORE_SEED, authority.key().as_ref()],
        bump,
    )]
    pub store: Account<'info, Store>,
    pub system_program: Program<'info, System>,
}
