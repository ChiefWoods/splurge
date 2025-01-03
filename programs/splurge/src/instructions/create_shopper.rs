use crate::{constants::*, error::SplurgeError, state::*};
use anchor_lang::prelude::*;

pub fn create_shopper(
    ctx: Context<CreateShopper>,
    name: String,
    image: String,
    address: String,
) -> Result<()> {
    require!(!name.is_empty(), SplurgeError::ShopperNameRequired);
    require!(
        name.len() <= MAX_SHOPPER_NAME_LEN,
        SplurgeError::ShopperNameTooLong
    );
    require!(!image.is_empty(), SplurgeError::ShopperImageRequired);
    require!(!address.is_empty(), SplurgeError::ShopperAddressRequired);

    let shopper = &mut ctx.accounts.shopper;

    shopper.bump = ctx.bumps.shopper;
    shopper.name = name;
    shopper.image = image;
    shopper.address = address;
    shopper.orders = Vec::new();

    Ok(())
}

#[derive(Accounts)]
#[instruction(name: String, image: String, address: String)]
pub struct CreateShopper<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = Shopper::MIN_SPACE + name.len() + image.len() + address.len(),
        seeds = [SHOPPER_SEED, authority.key().as_ref()],
        bump,
    )]
    pub shopper: Account<'info, Shopper>,
    pub system_program: Program<'info, System>,
}
