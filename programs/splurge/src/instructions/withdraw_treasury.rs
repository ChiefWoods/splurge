use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::{transfer_checked, TransferChecked},
    token_interface::{Mint, TokenAccount, TokenInterface},
};

use crate::{
    constants::{CONFIG_SEED, TREASURY_SEED},
    error::SplurgeError,
    state::Config,
    treasury_signer,
};

#[derive(Accounts)]
pub struct WithdrawTreasury<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        seeds = [TREASURY_SEED],
        bump = config.treasury_bump,
    )]
    pub treasury: SystemAccount<'info>,
    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
        has_one = admin @ SplurgeError::UnauthorizedAdmin,
    )]
    pub config: Account<'info, Config>,
    #[account(
        mint::token_program = token_program,
    )]
    pub payment_mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = payment_mint,
        associated_token::authority = treasury,
        associated_token::token_program = token_program,
    )]
    pub treasury_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = admin,
        associated_token::mint = payment_mint,
        associated_token::authority = admin,
        associated_token::token_program = token_program,
    )]
    pub admin_token_account: InterfaceAccount<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl WithdrawTreasury<'_> {
    pub fn handler(ctx: Context<WithdrawTreasury>) -> Result<()> {
        let WithdrawTreasury {
            admin_token_account,
            config,
            payment_mint,
            token_program,
            treasury,
            treasury_token_account,
            ..
        } = ctx.accounts;

        let signer_seeds: &[&[u8]] = treasury_signer!(config.treasury_bump);

        transfer_checked(
            CpiContext::new(
                token_program.to_account_info(),
                TransferChecked {
                    from: treasury_token_account.to_account_info(),
                    authority: treasury.to_account_info(),
                    mint: payment_mint.to_account_info(),
                    to: admin_token_account.to_account_info(),
                },
            )
            .with_signer(&[signer_seeds]),
            treasury_token_account.amount,
            payment_mint.decimals,
        )
    }
}
