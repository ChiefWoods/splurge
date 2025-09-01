use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        close_account, transfer_checked, CloseAccount, Mint, TokenAccount, TokenInterface,
        TransferChecked,
    },
};

use crate::{
    constants::{CONFIG_SEED, ORDER_SEED, STORE_SEED},
    error::SplurgeError,
    events::OrderCompleted,
    order_signer,
    state::{Config, Item, Order, OrderStatus, Shopper, Store},
};

#[derive(Accounts)]
pub struct CompleteOrder<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(mut)]
    pub authority: SystemAccount<'info>,
    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
        has_one = admin @ SplurgeError::UnauthorizedAdmin,
    )]
    pub config: Account<'info, Config>,
    #[account(
        has_one = authority
    )]
    pub shopper: Account<'info, Shopper>,
    #[account(
        seeds = [STORE_SEED, store.authority.key().as_ref()],
        bump = store.bump,
    )]
    pub store: Account<'info, Store>,
    #[account(
        has_one = store,
    )]
    pub item: Account<'info, Item>,
    #[account(
        mut,
        seeds = [ORDER_SEED, shopper.key().as_ref(), item.key().as_ref(), order.timestamp.to_le_bytes().as_ref()],
        bump = order.bump,
        has_one = payment_mint,
        constraint = order.status != OrderStatus::Completed @ SplurgeError::OrderAlreadyCompleted,
        constraint = order.status == OrderStatus::Shipping @ SplurgeError::OrderNotBeingShipped,
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
        associated_token::authority = order,
        associated_token::token_program = token_program,
    )]
    pub order_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = admin,
        associated_token::mint = payment_mint,
        associated_token::authority = store,
        associated_token::token_program = token_program,
    )]
    pub store_token_account: InterfaceAccount<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl CompleteOrder<'_> {
    pub fn handler(ctx: Context<CompleteOrder>) -> Result<()> {
        let CompleteOrder {
            authority,
            config,
            item,
            order,
            order_token_account,
            payment_mint,
            shopper,
            store_token_account,
            token_program,
            ..
        } = ctx.accounts;

        config.validate_mint(payment_mint.key())?;

        let shopper_key = shopper.key();
        let item_key = item.key();
        let order_timestamp = order.timestamp.to_le_bytes();

        let signer_seeds: &[&[u8]] =
            order_signer!(shopper_key, item_key, order_timestamp, order.bump);

        transfer_checked(
            CpiContext::new(
                token_program.to_account_info(),
                TransferChecked {
                    authority: order.to_account_info(),
                    mint: payment_mint.to_account_info(),
                    from: order_token_account.to_account_info(),
                    to: store_token_account.to_account_info(),
                },
            )
            .with_signer(&[signer_seeds]),
            order_token_account.amount,
            payment_mint.decimals,
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
            .with_signer(&[signer_seeds]),
        )?;

        order.status = OrderStatus::Completed;

        emit!(OrderCompleted {
            order: order.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        Order::invariant(&order)
    }
}
