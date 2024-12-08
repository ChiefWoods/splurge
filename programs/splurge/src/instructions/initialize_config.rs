use crate::{constants::*, state::*};
use anchor_lang::prelude::*;

pub fn initialize_config(
    ctx: Context<InitializeConfig>,
    whitelisted_mints: Vec<Pubkey>,
) -> Result<()> {
    ctx.accounts.splurge_config.bump = ctx.bumps.splurge_config;
    ctx.accounts.splurge_config.admin = ctx.accounts.authority.key();
    ctx.accounts.splurge_config.whitelisted_mints = whitelisted_mints;

    Ok(())
}

#[derive(Accounts)]
#[instruction(whitelisted_mints: Vec<Pubkey>)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
      init,
      space = SplurgeConfig::MIN_SPACE + (32 * whitelisted_mints.len()),
      seeds = [SPLURGE_CONFIG_SEED],
      bump,
      payer = authority,
    )]
    pub splurge_config: Account<'info, SplurgeConfig>,
    pub system_program: Program<'info, System>,
}
