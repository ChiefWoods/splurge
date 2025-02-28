use anchor_lang::prelude::*;

use crate::{
    constants::{MAX_SHOPPER_NAME_LEN, SHOPPER_SEED},
    error::SplurgeError,
    state::Shopper,
};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateShopperArgs {
    pub name: String,
    pub image: String,
    pub address: String,
}

#[derive(Accounts)]
#[instruction(args: CreateShopperArgs)]
pub struct CreateShopper<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = Shopper::MIN_SPACE + args.name.len() + args.image.len() + args.address.len(),
        seeds = [SHOPPER_SEED, authority.key().as_ref()],
        bump,
    )]
    pub shopper: Account<'info, Shopper>,
    pub system_program: Program<'info, System>,
}

impl CreateShopper<'_> {
    pub fn create_shopper(ctx: Context<CreateShopper>, args: CreateShopperArgs) -> Result<()> {
        require!(!args.name.is_empty(), SplurgeError::ShopperNameRequired);
        require!(
            args.name.len() <= MAX_SHOPPER_NAME_LEN,
            SplurgeError::ShopperNameTooLong
        );
        require!(!args.image.is_empty(), SplurgeError::ShopperImageRequired);
        require!(
            !args.address.is_empty(),
            SplurgeError::ShopperAddressRequired
        );

        ctx.accounts.shopper.set_inner(Shopper {
            bump: ctx.bumps.shopper,
            authority: ctx.accounts.authority.key(),
            name: args.name,
            image: args.image,
            address: args.address,
        });

        Shopper::invariant(&ctx.accounts.shopper)
    }
}
