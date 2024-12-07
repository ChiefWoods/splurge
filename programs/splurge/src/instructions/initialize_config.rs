use crate::{constants::*, error::ErrorCode, program::Splurge, state::*};
use anchor_lang::{prelude::*, Discriminator};

pub fn initialize_config(ctx: Context<InitializeConfig>) -> Result<()> {
    ctx.accounts.splurge_config.bump = ctx.bumps.splurge_config;
    ctx.accounts.splurge_config.admin = ctx.accounts.authority.key();

    Ok(())
}

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
      init,
      space = SplurgeConfig::DISCRIMINATOR.len() + SplurgeConfig::INIT_SPACE,
      seeds = [SPLURGE_CONFIG_SEED],
      bump,
      payer = authority,
    )]
    pub splurge_config: Account<'info, SplurgeConfig>,
    #[account(constraint = splurge_program.programdata_address()? == Some(splurge_program_data.key()) @ ErrorCode::IncorrectProgramDataAddress)]
    pub splurge_program: Program<'info, Splurge>,
    #[account(constraint = splurge_program_data.upgrade_authority_address == Some(authority.key()) @ ErrorCode::UnauthorizedAdmin)]
    pub splurge_program_data: Account<'info, ProgramData>,
    pub system_program: Program<'info, System>,
}
