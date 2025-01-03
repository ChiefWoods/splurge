use crate::{constants::*, error::SplurgeError, state::*};
use anchor_lang::{prelude::*, solana_program::pubkey::PUBKEY_BYTES};

pub fn remove_whitelisted_mint(
    ctx: Context<RemoveWhitelistedMint>,
    mints: Vec<Pubkey>,
) -> Result<()> {
    for mint in mints.iter() {
        if !ctx.accounts.splurge_config.whitelisted_mints.contains(mint) {
            return Err(SplurgeError::MintNotWhitelisted.into());
        }
    }

    require!(
        ctx.accounts.splurge_config.whitelisted_mints.len() > mints.len(),
        SplurgeError::CannotRemoveAllWhitelistedMints
    );

    ctx.accounts
        .splurge_config
        .whitelisted_mints
        .retain(|mint| !mints.contains(mint));

    Ok(())
}

#[derive(Accounts)]
#[instruction(new_mints: Vec<Pubkey>)]
pub struct RemoveWhitelistedMint<'info> {
    #[account(
        mut,
        address = splurge_config.admin @ SplurgeError::UnauthorizedAdmin,
    )]
    pub admin: Signer<'info>,
    #[account(
        mut,
        realloc = splurge_config.to_account_info().data_len() - (new_mints.len() * PUBKEY_BYTES),
        realloc::payer = admin,
        realloc::zero = false,
        seeds = [SPLURGE_CONFIG_SEED],
        bump = splurge_config.bump,
    )]
    pub splurge_config: Account<'info, SplurgeConfig>,
    pub system_program: Program<'info, System>,
}
