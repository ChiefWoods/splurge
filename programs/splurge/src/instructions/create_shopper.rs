use crate::{constants::*, error::ErrorCode, state::*};
use anchor_lang::prelude::*;

pub fn create_shopper(ctx: Context<CreateShopper>, name: String, image: String) -> Result<()> {
    require!(!name.is_empty(), ErrorCode::ShopperNameRequired);
    require!(
        name.len() <= MAX_SHOPPER_NAME_LEN,
        ErrorCode::ShopperNameTooLong
    );
    require!(!image.is_empty(), ErrorCode::ShopperImageRequired);

    let shopper = &mut ctx.accounts.shopper;

    shopper.bump = ctx.bumps.shopper;
    shopper.name = name;
    shopper.image = image;
    shopper.orders = Vec::new();

    Ok(())
}

#[derive(Accounts)]
#[instruction(name: String, image: String)]
pub struct CreateShopper<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
    init,
    space = Shopper::MIN_SPACE + name.len() + image.len(),
    seeds = [SHOPPER_SEED, authority.key().as_ref()],
    bump,
    payer = authority,
  )]
    pub shopper: Account<'info, Shopper>,
    pub system_program: Program<'info, System>,
}
