use anchor_lang::prelude::*;

use crate::{
    constants::{MAX_STORE_NAME_LEN, STORE_SEED},
    error::SplurgeError,
    state::Store,
};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateStoreArgs {
    pub name: String,
    pub image: String,
    pub about: String,
}

#[derive(Accounts)]
#[instruction(args: CreateStoreArgs)]
pub struct CreateStore<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = Store::MIN_SPACE + args.name.len() + args.image.len() + args.about.len(),
        seeds = [STORE_SEED, authority.key().as_ref()],
        bump,
    )]
    pub store: Account<'info, Store>,
    pub system_program: Program<'info, System>,
}

impl CreateStore<'_> {
    pub fn create_store(ctx: Context<CreateStore>, args: CreateStoreArgs) -> Result<()> {
        require!(!args.name.is_empty(), SplurgeError::StoreNameRequired);
        require!(
            args.name.len() <= MAX_STORE_NAME_LEN,
            SplurgeError::StoreNameTooLong
        );
        require!(!args.image.is_empty(), SplurgeError::StoreImageRequired);

        ctx.accounts.store.set_inner(Store {
            bump: ctx.bumps.store,
            authority: ctx.accounts.authority.key(),
            name: args.name,
            image: args.image,
            about: args.about,
        });

        Store::invariant(&ctx.accounts.store)
    }
}
