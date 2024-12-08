use crate::{constants::*, error::ErrorCode, state::*};
use anchor_lang::{prelude::*, solana_program::pubkey::PUBKEY_BYTES};

pub fn add_whitelisted_mint(ctx: Context<AddWhitelistedMint>, mints: Vec<Pubkey>) -> Result<()> {
    for mint in mints.iter() {
        if ctx.accounts.splurge_config.whitelisted_mints.contains(mint) {
            return Err(ErrorCode::MintAlreadyWhitelisted.into());
        }
    }

    ctx.accounts.splurge_config.whitelisted_mints.extend(mints);

    Ok(())
}

#[derive(Accounts)]
#[instruction(mints: Vec<Pubkey>)]
pub struct AddWhitelistedMint<'info> {
    #[account(
      mut,
      address = splurge_config.admin @ ErrorCode::UnauthorizedAdmin,
    )]
    pub admin: Signer<'info>,
    #[account(
      mut,
      realloc = splurge_config.to_account_info().data_len() + (mints.len() * PUBKEY_BYTES),
      realloc::payer = admin,
      realloc::zero = false,
      seeds = [SPLURGE_CONFIG_SEED],
      bump = splurge_config.bump,
    )]
    pub splurge_config: Account<'info, SplurgeConfig>,
    pub system_program: Program<'info, System>,
}
