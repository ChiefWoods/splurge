use crate::{constants::*, error::SplurgeError, state::*};
use anchor_lang::{prelude::*, solana_program::pubkey::PUBKEY_BYTES, Discriminator};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};

pub fn create_order(
    ctx: Context<CreateOrder>,
    timestamp: i64,
    amount: i64,
    total_usd: f64,
) -> Result<()> {
    require!(amount > 0, SplurgeError::OrderAmountInvalid);
    require!(total_usd > 0.0, SplurgeError::OrderTotalInvalid);

    let store_item = &mut ctx.accounts.store_item;

    require!(
        store_item.price * amount as f64 == total_usd,
        SplurgeError::OrderTotalIncorrect
    );
    require!(
        store_item.inventory_count >= amount,
        SplurgeError::InsufficientInventory
    );

    let payment_mint = &ctx.accounts.payment_mint;

    let decimals = payment_mint.decimals;

    transfer_checked(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.authority_token_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
                mint: payment_mint.to_account_info(),
                to: ctx.accounts.order_token_account.to_account_info(),
            },
        ),
        (total_usd * 10_u32.pow(decimals as u32) as f64) as u64,
        decimals,
    )?;

    let order = &mut ctx.accounts.order;

    order.bump = ctx.bumps.order;
    order.status = OrderStatus::default();
    order.timestamp = timestamp;
    order.amount = amount;
    order.total_usd = total_usd;
    order.payment_mint = ctx.accounts.payment_mint.key();
    order.shopper = ctx.accounts.shopper.key();
    order.store_item = store_item.key();

    store_item.inventory_count -= amount;

    ctx.accounts.shopper.orders.push(ctx.accounts.order.key());

    Ok(())
}

#[derive(Accounts)]
#[instruction(timestamp: i64)]
pub struct CreateOrder<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        address = splurge_config.admin @ SplurgeError::UnauthorizedAdmin,
    )]
    pub admin: Signer<'info>,
    #[account(
        seeds = [SPLURGE_CONFIG_SEED],
        bump = splurge_config.bump,
    )]
    pub splurge_config: Account<'info, SplurgeConfig>,
    #[account(
        mut,
        realloc = shopper.to_account_info().data_len() + PUBKEY_BYTES,
        realloc::payer = authority,
        realloc::zero = false,
        seeds = [SHOPPER_SEED, authority.key().as_ref()],
        bump = shopper.bump,
    )]
    pub shopper: Box<Account<'info, Shopper>>,
    pub store: Box<Account<'info, Store>>,
    #[account(mut)]
    pub store_item: Box<Account<'info, StoreItem>>,
    #[account(
        init,
        payer = authority,
        space = Order::DISCRIMINATOR.len() + Order::INIT_SPACE,
        seeds = [ORDER_SEED, shopper.key().as_ref(), store_item.key().as_ref(), timestamp.to_le_bytes().as_ref()],
        bump,
    )]
    pub order: Box<Account<'info, Order>>,
    #[account(
        constraint = splurge_config.whitelisted_mints.contains(&payment_mint.key()) @ SplurgeError::PaymentMintNotWhitelisted,
    )]
    pub payment_mint: InterfaceAccount<'info, Mint>,
    #[account(
        init,
        payer = admin,
        associated_token::mint = payment_mint,
        associated_token::authority = order,
        associated_token::token_program = token_program,
    )]
    pub order_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = payment_mint,
        associated_token::authority = authority,
        associated_token::token_program = token_program,
    )]
    pub authority_token_account: InterfaceAccount<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}
