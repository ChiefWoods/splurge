use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        close_account, transfer_checked, CloseAccount, Mint, TokenAccount, TokenInterface,
        TransferChecked,
    },
};

use crate::{
    constants::{CONFIG_SEED, ITEM_SEED, ORDER_SEED, STORE_SEED},
    error::SplurgeError,
    events::OrderCompleted,
    state::{Config, Item, Order, OrderStatus, Shopper, Store},
    utils::{get_order_fee_in_atomic, get_total_in_atomic},
};

#[derive(Accounts)]
pub struct CompleteOrder<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    pub treasury: SystemAccount<'info>,
    #[account(mut)]
    pub authority: SystemAccount<'info>,
    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
        has_one = admin @ SplurgeError::UnauthorizedAdmin,
        has_one = treasury,
    )]
    pub config: Box<Account<'info, Config>>,
    #[account(
        has_one = authority
    )]
    pub shopper: Box<Account<'info, Shopper>>,
    #[account(
        seeds = [STORE_SEED, store.authority.key().as_ref()],
        bump = store.bump,
    )]
    pub store: Box<Account<'info, Store>>,
    #[account(
        seeds = [ITEM_SEED, store.key().as_ref(), item.name.as_bytes()],
        bump = item.bump,
    )]
    pub item: Box<Account<'info, Item>>,
    #[account(
        mut,
        seeds = [ORDER_SEED, shopper.key().as_ref(), item.key().as_ref(), order.timestamp.to_le_bytes().as_ref()],
        bump = order.bump,
        has_one = payment_mint,
    )]
    pub order: Box<Account<'info, Order>>,
    #[account(
        mint::token_program = token_program,
        constraint = config.whitelisted_mints.contains(&payment_mint.key()) @ SplurgeError::MintNotWhitelisted,
    )]
    pub payment_mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        mut,
        associated_token::mint = payment_mint,
        associated_token::authority = order,
        associated_token::token_program = token_program,
    )]
    pub order_ata: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        init_if_needed,
        payer = admin,
        associated_token::mint = payment_mint,
        associated_token::authority = store,
        associated_token::token_program = token_program,
    )]
    pub store_ata: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        init_if_needed,
        payer = admin,
        associated_token::mint = payment_mint,
        associated_token::authority = treasury,
        associated_token::token_program = token_program,
    )]
    pub treasury_ata: Box<InterfaceAccount<'info, TokenAccount>>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl CompleteOrder<'_> {
    pub fn complete_order(ctx: Context<CompleteOrder>) -> Result<()> {
        let order = &mut ctx.accounts.order;
        let order_ata = &ctx.accounts.order_ata;
        let payment_mint = &ctx.accounts.payment_mint;

        require!(
            order.status == OrderStatus::Shipping,
            SplurgeError::OrderNotBeingShipped
        );
        require!(
            order.status != OrderStatus::Completed,
            SplurgeError::OrderAlreadyCompleted
        );

        order.status = OrderStatus::Completed;

        let shopper_key = ctx.accounts.shopper.key();
        let item_key = ctx.accounts.item.key();

        let signer_seeds: &[&[&[u8]]] = &[&[
            ORDER_SEED,
            shopper_key.as_ref(),
            item_key.as_ref(),
            &order.timestamp.to_le_bytes()[..],
            &[order.bump],
        ]];

        let total_in_atomic = get_total_in_atomic(order.total, payment_mint.decimals);

        let order_fee_in_atomic =
            get_order_fee_in_atomic(total_in_atomic, ctx.accounts.config.order_fee_bps);

        transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    authority: order.to_account_info(),
                    mint: payment_mint.to_account_info(),
                    from: order_ata.to_account_info(),
                    to: ctx.accounts.treasury_ata.to_account_info(),
                },
            )
            .with_signer(signer_seeds),
            order_fee_in_atomic,
            payment_mint.decimals,
        )?;

        transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    authority: order.to_account_info(),
                    mint: payment_mint.to_account_info(),
                    from: order_ata.to_account_info(),
                    to: ctx.accounts.store_ata.to_account_info(),
                },
            )
            .with_signer(signer_seeds),
            order_ata.amount - order_fee_in_atomic,
            payment_mint.decimals,
        )?;

        close_account(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                CloseAccount {
                    authority: order.to_account_info(),
                    account: order_ata.to_account_info(),
                    destination: ctx.accounts.authority.to_account_info(),
                },
            )
            .with_signer(signer_seeds),
        )?;

        emit!(OrderCompleted {
            order: ctx.accounts.order.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}
