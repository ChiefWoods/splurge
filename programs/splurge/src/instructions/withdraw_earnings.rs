use crate::{constants::*, error::ErrorCode, state::*};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        close_account, transfer_checked, CloseAccount, Mint, TokenAccount, TokenInterface,
        TransferChecked,
    },
};

pub fn withdraw_earnings(ctx: Context<WithdrawEarnings>) -> Result<()> {
    let authority_key = ctx.accounts.authority.key();
    let store_token_account = &ctx.accounts.store_token_account;
    let payment_mint = &ctx.accounts.payment_mint;
    let store = &ctx.accounts.store;

    let signer_seeds: &[&[&[u8]]] = &[&[STORE_SEED, authority_key.as_ref(), &[store.bump]]];

    transfer_checked(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            TransferChecked {
                from: store_token_account.to_account_info(),
                authority: store.to_account_info(),
                mint: payment_mint.to_account_info(),
                to: ctx.accounts.authority_token_account.to_account_info(),
            },
        )
        .with_signer(signer_seeds),
        store_token_account.amount,
        payment_mint.decimals,
    )?;

    close_account(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            CloseAccount {
                account: store_token_account.to_account_info(),
                authority: store.to_account_info(),
                destination: ctx.accounts.admin.to_account_info(),
            },
        )
        .with_signer(signer_seeds),
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawEarnings<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        address = splurge_config.admin @ ErrorCode::UnauthorizedAdmin,
    )]
    pub admin: Signer<'info>,
    #[account(
        seeds = [SPLURGE_CONFIG_SEED],
        bump = splurge_config.bump,
    )]
    pub splurge_config: Account<'info, SplurgeConfig>,
    #[account(
        seeds = [STORE_SEED, authority.key().as_ref()],
        bump = store.bump,
    )]
    pub store: Account<'info, Store>,
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
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}
