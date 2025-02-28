use anchor_lang::{prelude::*, Discriminator};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};

use crate::{
    constants::{CONFIG_SEED, ITEM_SEED, ORDER_SEED, SHOPPER_SEED, STORE_SEED},
    error::SplurgeError,
    events::OrderCreated,
    state::{Config, Item, Order, OrderStatus, Shopper, Store},
    utils::{get_order_fee_in_atomic, get_total_in_atomic},
};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateOrderArgs {
    pub amount: u32,
    pub timestamp: i64,
}

#[derive(Accounts)]
#[instruction(args: CreateOrderArgs)]
pub struct CreateOrder<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
    )]
    pub config: Box<Account<'info, Config>>,
    #[account(
        seeds = [SHOPPER_SEED, authority.key().as_ref()],
        bump = shopper.bump,
    )]
    pub shopper: Box<Account<'info, Shopper>>,
    #[account(
        seeds = [STORE_SEED, store.authority.key().as_ref()],
        bump = store.bump,
    )]
    pub store: Box<Account<'info, Store>>,
    #[account(
        mut,
        seeds = [ITEM_SEED, store.key().as_ref(), item.name.as_bytes()],
        bump = item.bump,
    )]
    pub item: Box<Account<'info, Item>>,
    #[account(
        init,
        payer = authority,
        space = Order::DISCRIMINATOR.len() + Order::INIT_SPACE,
        seeds = [ORDER_SEED, shopper.key().as_ref(), item.key().as_ref(), args.timestamp.to_le_bytes().as_ref()],
        bump,
    )]
    pub order: Box<Account<'info, Order>>,
    #[account(
        mint::token_program = token_program,
        constraint = config.whitelisted_mints.contains(&payment_mint.key()) @ SplurgeError::MintNotWhitelisted,
    )]
    pub payment_mint: InterfaceAccount<'info, Mint>,
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = payment_mint,
        associated_token::authority = order,
        associated_token::token_program = token_program,
    )]
    pub order_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = payment_mint,
        associated_token::authority = authority,
        associated_token::token_program = token_program,
    )]
    pub authority_ata: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl CreateOrder<'_> {
    pub fn create_order(ctx: Context<CreateOrder>, args: CreateOrderArgs) -> Result<()> {
        require_eq!(
            ctx.accounts.config.platform_locked,
            false,
            SplurgeError::PlatformLocked
        );

        let item = &mut ctx.accounts.item;

        item.inventory_count = item
            .inventory_count
            .checked_sub(args.amount)
            .ok_or(SplurgeError::InsufficientInventory)?;

        let total_in_usd = args.amount * item.price;

        ctx.accounts.order.set_inner(Order {
            bump: ctx.bumps.order,
            shopper: ctx.accounts.shopper.key(),
            item: ctx.accounts.item.key(),
            timestamp: args.timestamp,
            status: OrderStatus::default(),
            amount: args.amount,
            total: total_in_usd,
            payment_mint: ctx.accounts.payment_mint.key(),
        });

        let decimals = ctx.accounts.payment_mint.decimals;
        let total_in_atomic = get_total_in_atomic(total_in_usd, decimals);

        transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    authority: ctx.accounts.authority.to_account_info(),
                    mint: ctx.accounts.payment_mint.to_account_info(),
                    from: ctx.accounts.authority_ata.to_account_info(),
                    to: ctx.accounts.order_ata.to_account_info(),
                },
            ),
            total_in_atomic
                .checked_add(get_order_fee_in_atomic(
                    total_in_atomic,
                    ctx.accounts.config.order_fee_bps,
                ))
                .unwrap(),
            decimals,
        )?;

        emit!(OrderCreated {
            store: ctx.accounts.store.key(),
            timestamp: args.timestamp,
        });

        Order::invariant(&ctx.accounts.order)
    }
}
