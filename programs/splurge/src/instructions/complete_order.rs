use crate::{constants::*, error::ErrorCode, state::*};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        close_account, transfer_checked, CloseAccount, Mint, TokenAccount, TokenInterface,
        TransferChecked,
    },
};

pub fn complete_order(ctx: Context<CompleteOrder>, timestamp: i64) -> Result<()> {
    let order = &mut ctx.accounts.order;
    let order_token_account = &ctx.accounts.order_token_account;
    let payment_mint = &ctx.accounts.payment_mint;

    require!(
        order.status == OrderStatus::Shipping,
        ErrorCode::OrderNotShipping
    );

    require!(
        order.status != OrderStatus::Completed,
        ErrorCode::OrderAlreadyCompleted
    );

    let shopper_key = ctx.accounts.shopper.key();
    let store_item_key = ctx.accounts.store_item.key();
    let timestamp_bytes = timestamp.to_le_bytes();

    let signer_seeds: &[&[&[u8]]] = &[&[
        ORDER_SEED,
        shopper_key.as_ref(),
        store_item_key.as_ref(),
        timestamp_bytes.as_ref(),
        &[order.bump],
    ]];

    transfer_checked(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            TransferChecked {
                from: order_token_account.to_account_info(),
                authority: order.to_account_info(),
                mint: payment_mint.to_account_info(),
                to: ctx.accounts.store_token_account.to_account_info(),
            },
        )
        .with_signer(signer_seeds),
        order_token_account.amount,
        payment_mint.decimals,
    )?;

    close_account(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            CloseAccount {
                account: order_token_account.to_account_info(),
                authority: order.to_account_info(),
                destination: ctx.accounts.admin.to_account_info(),
            },
        )
        .with_signer(signer_seeds),
    )?;

    order.status = OrderStatus::Completed;

    Ok(())
}

#[derive(Accounts)]
#[instruction(timestamp: i64)]
pub struct CompleteOrder<'info> {
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
        constraint = shopper.orders.iter().any(|shopper_order| shopper_order == &order.key()),
    )]
    pub shopper: Account<'info, Shopper>,
    pub store: Account<'info, Store>,
    pub store_item: Account<'info, StoreItem>,
    #[account(
        mut,
        seeds = [ORDER_SEED, shopper.key().as_ref(), store_item.key().as_ref(), timestamp.to_le_bytes().as_ref()],
        bump = order.bump,
    )]
    pub order: Box<Account<'info, Order>>,
    #[account(
        address = order.payment_mint,
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
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}
