use anchor_lang::prelude::*;

use crate::{
    constants::{MAX_STORE_NAME_LEN, STORE_SEED},
    error::SplurgeError,
    events::StoreInitialized,
    state::Store,
};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializeStoreArgs {
    pub name: String,
    pub image: String,
    pub about: String,
}

#[derive(Accounts)]
#[instruction(args: InitializeStoreArgs)]
pub struct InitializeStore<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = Store::space(&args.name, &args.image, &args.about),
        seeds = [STORE_SEED, authority.key().as_ref()],
        bump,
    )]
    pub store: Account<'info, Store>,
    pub system_program: Program<'info, System>,
}

impl InitializeStore<'_> {
    pub fn handler(ctx: Context<InitializeStore>, args: InitializeStoreArgs) -> Result<()> {
        let InitializeStoreArgs { name, image, about } = args;

        require!(!name.is_empty(), SplurgeError::StoreNameRequired);
        require!(
            name.len() <= MAX_STORE_NAME_LEN as usize,
            SplurgeError::StoreNameTooLong
        );

        let InitializeStore {
            authority, store, ..
        } = ctx.accounts;

        store.set_inner(Store {
            bump: ctx.bumps.store,
            authority: authority.key(),
            name,
            image,
            about,
        });

        emit!(StoreInitialized {
            store: store.key(),
            authority: authority.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        Store::invariant(&store)
    }
}
