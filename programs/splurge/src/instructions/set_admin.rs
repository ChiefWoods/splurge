use crate::{constants::*, error::ErrorCode, state::*};
use anchor_lang::prelude::*;

pub fn set_admin(ctx: Context<SetAdmin>, new_admin: Pubkey) -> Result<()> {
    ctx.accounts.splurge_config.admin = new_admin;

    Ok(())
}

#[derive(Accounts)]
#[instruction(new_admin: Pubkey)]
pub struct SetAdmin<'info> {
    #[account(
      mut,
      address = splurge_config.admin @ ErrorCode::UnauthorizedAdmin,
      constraint = splurge_config.admin != new_admin @ ErrorCode::AdminAlreadyAssigned
    )]
    pub authority: Signer<'info>,
    #[account(
      mut,
      seeds = [SPLURGE_CONFIG_SEED],
      bump = splurge_config.bump,
    )]
    pub splurge_config: Account<'info, SplurgeConfig>,
}
