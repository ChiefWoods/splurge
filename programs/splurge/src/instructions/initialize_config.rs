use crate::{constants::*, state::*};
use anchor_lang::{prelude::*, solana_program::pubkey::PUBKEY_BYTES};

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
        payer = authority,
        space = SplurgeConfig::MIN_SPACE + (whitelisted_mints.len() * PUBKEY_BYTES),
        seeds = [SPLURGE_CONFIG_SEED],
        bump,
    )]
    pub splurge_config: Account<'info, SplurgeConfig>,
    pub system_program: Program<'info, System>,
}
