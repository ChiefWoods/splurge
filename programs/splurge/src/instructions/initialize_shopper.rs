use anchor_lang::prelude::*;

use crate::{
    constants::{MAX_SHOPPER_NAME_LEN, SHOPPER_SEED},
    error::SplurgeError,
    events::ShopperInitialized,
    state::Shopper,
};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializeShopperArgs {
    pub name: String,
    pub image: String,
    pub address: String,
}

#[derive(Accounts)]
#[instruction(args: InitializeShopperArgs)]
pub struct InitializeShopper<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = Shopper::space(&args.name, &args.image, &args.address),
        seeds = [SHOPPER_SEED, authority.key().as_ref()],
        bump,
    )]
    pub shopper: Account<'info, Shopper>,
    pub system_program: Program<'info, System>,
}

impl InitializeShopper<'_> {
    pub fn handler(ctx: Context<InitializeShopper>, args: InitializeShopperArgs) -> Result<()> {
        let InitializeShopperArgs {
            name,
            image,
            address,
        } = args;

        require!(!name.is_empty(), SplurgeError::ShopperNameRequired);
        require!(
            name.len() <= MAX_SHOPPER_NAME_LEN,
            SplurgeError::ShopperNameTooLong
        );
        require!(!address.is_empty(), SplurgeError::ShopperAddressRequired);

        ctx.accounts.shopper.set_inner(Shopper {
            bump: ctx.bumps.shopper,
            authority: ctx.accounts.authority.key(),
            name,
            image,
            address,
        });

        emit!(ShopperInitialized {
            shopper: ctx.accounts.shopper.key(),
            authority: ctx.accounts.authority.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        Shopper::invariant(&ctx.accounts.shopper)
    }
}
