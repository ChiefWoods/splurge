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
    pub fn handler(ctx: Context<CreateStore>, args: CreateStoreArgs) -> Result<()> {
        let CreateStoreArgs { name, image, about } = args;

        require!(!name.is_empty(), SplurgeError::StoreNameRequired);
        require!(
            name.len() <= MAX_STORE_NAME_LEN,
            SplurgeError::StoreNameTooLong
        );
        require!(!image.is_empty(), SplurgeError::StoreImageRequired);

        ctx.accounts.store.set_inner(Store {
            bump: ctx.bumps.store,
            authority: ctx.accounts.authority.key(),
            name,
            image,
            about,
        });

        Store::invariant(&ctx.accounts.store)
    }
}
