use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::{close_account, transfer_checked, CloseAccount, TransferChecked},
    token_interface::{Mint, TokenAccount, TokenInterface},
};

use crate::{
    constants::{CONFIG_SEED, ORDER_SEED, TREASURY_SEED},
    error::SplurgeError,
    events::OrderCancelled,
    order_signer, treasury_signer, Config, Order, OrderStatus, Shopper,
};

#[derive(Accounts)]
pub struct CancelOrder<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        seeds = [TREASURY_SEED],
        bump = config.treasury_bump,
    )]
    pub treasury: SystemAccount<'info>,
    #[account(mut)]
    pub authority: SystemAccount<'info>,
    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
        has_one = admin @ SplurgeError::UnauthorizedAdmin,
    )]
    pub config: Account<'info, Config>,
    #[account(
        has_one = authority @ SplurgeError::InvalidShopperAuthority,
    )]
    pub shopper: Account<'info, Shopper>,
    #[account(
        mut,
        seeds = [ORDER_SEED, shopper.key().as_ref(), order.item.key().as_ref(), order.timestamp.to_le_bytes().as_ref()],
        bump = order.bump,
        constraint = order.status == OrderStatus::Pending || order.status == OrderStatus::Shipping @ SplurgeError::OrderAlreadyFinalized,
        constraint = order.payment_mint == payment_mint.key() @ SplurgeError::InvalidOrderPaymentMint,
    )]
    pub order: Account<'info, Order>,
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
        mut,
        associated_token::mint = payment_mint,
        associated_token::authority = order,
        associated_token::token_program = token_program,
    )]
    pub order_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = admin,
        associated_token::mint = payment_mint,
        associated_token::authority = authority,
        associated_token::token_program = token_program,
    )]
    pub authority_token_account: InterfaceAccount<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl CancelOrder<'_> {
    pub fn handler(ctx: Context<CancelOrder>) -> Result<()> {
        let CancelOrder {
            authority,
            authority_token_account,
            config,
            order,
            order_token_account,
            payment_mint,
            shopper,
            token_program,
            treasury,
            treasury_token_account,
            ..
        } = ctx.accounts;

        order.status = OrderStatus::Cancelled;

        let treasury_signer_seeds: &[&[u8]] = treasury_signer!(config.treasury_bump);
        let shopper_key = shopper.key();
        let item_key = order.item.key();
        let timestamp_bytes = order.timestamp.to_le_bytes();
        let order_signer_seeds: &[&[u8]] =
            order_signer!(shopper_key, item_key, timestamp_bytes, order.bump);
        let decimals = payment_mint.decimals;

        transfer_checked(
            CpiContext::new(
                token_program.to_account_info(),
                TransferChecked {
                    authority: order.to_account_info(),
                    mint: payment_mint.to_account_info(),
                    from: order_token_account.to_account_info(),
                    to: authority_token_account.to_account_info(),
                },
            )
            .with_signer(&[order_signer_seeds]),
            order.payment_subtotal,
            decimals,
        )?;

        close_account(
            CpiContext::new(
                token_program.to_account_info(),
                CloseAccount {
                    authority: order.to_account_info(),
                    account: order_token_account.to_account_info(),
                    destination: authority.to_account_info(),
                },
            )
            .with_signer(&[order_signer_seeds]),
        )?;

        transfer_checked(
            CpiContext::new(
                token_program.to_account_info(),
                TransferChecked {
                    authority: treasury.to_account_info(),
                    mint: payment_mint.to_account_info(),
                    from: treasury_token_account.to_account_info(),
                    to: authority_token_account.to_account_info(),
                },
            )
            .with_signer(&[treasury_signer_seeds]),
            order.platform_fee,
            decimals,
        )?;

        emit!(OrderCancelled {
            order: order.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}
