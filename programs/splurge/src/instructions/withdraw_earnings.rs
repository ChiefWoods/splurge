use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};

use crate::{
    constants::{CONFIG_SEED, STORE_SEED},
    state::{Config, Store},
};

#[derive(Accounts)]
pub struct WithdrawEarnings<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,
    #[account(
        seeds = [STORE_SEED, authority.key().as_ref()],
        bump = store.bump,
    )]
    pub store: Account<'info, Store>,
    #[account(
        mint::token_program = token_program,
    )]
    pub payment_mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = payment_mint,
        associated_token::authority = store,
        associated_token::token_program = token_program,
    )]
    pub store_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = payment_mint,
        associated_token::authority = authority,
        associated_token::token_program = token_program,
    )]
    pub authority_token_account: InterfaceAccount<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl WithdrawEarnings<'_> {
    pub fn handler(ctx: Context<WithdrawEarnings>) -> Result<()> {
        let config = &ctx.accounts.config;
        let payment_mint = &ctx.accounts.payment_mint;

        config.validate_mint(payment_mint.key())?;

        let store_ata = &ctx.accounts.store_token_account;
        let store = &ctx.accounts.store;

        let authority_key = ctx.accounts.store.authority.key();
        let signer_seeds: &[&[u8]] = &[STORE_SEED, authority_key.as_ref(), &[store.bump]];

        transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: store_ata.to_account_info(),
                    authority: store.to_account_info(),
                    mint: payment_mint.to_account_info(),
                    to: ctx.accounts.authority_token_account.to_account_info(),
                },
            )
            .with_signer(&[signer_seeds]),
            store_ata.amount,
            payment_mint.decimals,
        )
    }
}
