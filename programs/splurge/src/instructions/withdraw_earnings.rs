use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        close_account, transfer_checked, CloseAccount, Mint, TokenAccount, TokenInterface,
        TransferChecked,
    },
};

use crate::{
    constants::{CONFIG_SEED, STORE_SEED},
    error::SplurgeError,
    state::{Config, Store},
};

#[derive(Accounts)]
pub struct WithdrawEarnings<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub treasury: SystemAccount<'info>,
    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
        has_one = treasury,
    )]
    pub config: Account<'info, Config>,
    #[account(
        has_one = authority,
    )]
    pub store: Account<'info, Store>,
    #[account(
        mint::token_program = token_program,
        constraint = config.whitelisted_mints.contains(&payment_mint.key()) @ SplurgeError::MintNotWhitelisted,
    )]
    pub payment_mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = payment_mint,
        associated_token::authority = store,
        associated_token::token_program = token_program,
    )]
    pub store_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = payment_mint,
        associated_token::authority = authority,
        associated_token::token_program = token_program,
    )]
    pub authority_ata: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl WithdrawEarnings<'_> {
    pub fn withdraw_earnings(ctx: Context<WithdrawEarnings>) -> Result<()> {
        let store_ata = &ctx.accounts.store_ata;
        let payment_mint = &ctx.accounts.payment_mint;
        let store = &ctx.accounts.store;

        let signer_seeds: &[&[&[u8]]] = &[&[
            STORE_SEED,
            ctx.accounts.authority.key.as_ref(),
            &[store.bump],
        ]];

        transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: store_ata.to_account_info(),
                    authority: store.to_account_info(),
                    mint: payment_mint.to_account_info(),
                    to: ctx.accounts.authority_ata.to_account_info(),
                },
            )
            .with_signer(signer_seeds),
            store_ata.amount,
            payment_mint.decimals,
        )?;

        close_account(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                CloseAccount {
                    authority: store.to_account_info(),
                    account: store_ata.to_account_info(),
                    destination: ctx.accounts.treasury.to_account_info(),
                },
            )
            .with_signer(signer_seeds),
        )
    }
}
