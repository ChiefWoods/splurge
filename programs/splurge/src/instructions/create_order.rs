use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::spl_token_2022::extension::transfer_fee::MAX_FEE_BASIS_POINTS,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};
use pyth_solana_receiver_sdk::error::GetPriceError;
use pyth_solana_receiver_sdk::price_update::{PriceFeedMessage, PriceUpdateV2};
use spl_math::precise_number::PreciseNumber;

use crate::{
    constants::{CONFIG_SEED, MAX_ORACLE_STALENESS, ORDER_SEED, SHOPPER_SEED, STORE_SEED},
    error::SplurgeError,
    events::OrderCreated,
    imprecise_number, precise_number,
    state::{Config, Item, Order, OrderStatus, Shopper, Store},
};

#[derive(Accounts)]
#[instruction(_amount: u32, timestamp: i64)]
pub struct CreateOrder<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    pub treasury: SystemAccount<'info>,
    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
        has_one = treasury,
        constraint = !config.is_paused @ SplurgeError::PlatformPaused,
    )]
    pub config: Account<'info, Config>,
    #[account(
        seeds = [SHOPPER_SEED, authority.key().as_ref()],
        bump = shopper.bump,
    )]
    pub shopper: Account<'info, Shopper>,
    #[account(
        seeds = [STORE_SEED, store.authority.key().as_ref()],
        bump = store.bump,
    )]
    pub store: Account<'info, Store>,
    #[account(
        mut,
        has_one = store,
    )]
    pub item: Account<'info, Item>,
    #[account(
        init,
        payer = authority,
        space = Order::DISCRIMINATOR.len() + Order::INIT_SPACE,
        seeds = [ORDER_SEED, shopper.key().as_ref(), item.key().as_ref(), timestamp.to_le_bytes().as_ref()],
        bump,
    )]
    pub order: Account<'info, Order>,
    pub price_update_v2: Account<'info, PriceUpdateV2>,
    #[account(
        mint::token_program = token_program,
    )]
    pub payment_mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = payment_mint,
        associated_token::authority = authority,
        associated_token::token_program = token_program,
    )]
    pub authority_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = payment_mint,
        associated_token::authority = treasury,
        associated_token::token_program = token_program,
    )]
    pub treasury_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = payment_mint,
        associated_token::authority = order,
        associated_token::token_program = token_program,
    )]
    pub order_token_account: InterfaceAccount<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl CreateOrder<'_> {
    pub fn handler(ctx: Context<CreateOrder>, amount: u32, timestamp: i64) -> Result<()> {
        let config = &ctx.accounts.config;
        let payment_mint = &ctx.accounts.payment_mint;

        config.validate_mint(payment_mint.key())?;

        let price_update_v2 = &ctx.accounts.price_update_v2;

        config.validate_price_update_v2(price_update_v2.key())?;

        let PriceFeedMessage {
            exponent,
            price,
            publish_time,
            ..
        } = price_update_v2.price_message;

        #[cfg(not(feature = "no-staleness-check"))]
        require!(
            timestamp - publish_time <= MAX_ORACLE_STALENESS as i64,
            GetPriceError::PriceTooOld
        );

        require!(price > 0, SplurgeError::InvalidPrice);

        let ops = if exponent > 0 {
            PreciseNumber::checked_mul
        } else {
            PreciseNumber::checked_div
        };

        let oracle_price = ops(
            &precise_number!(price as u128),
            &precise_number!(10_u64.pow(exponent.abs() as u32) as u128),
        )
        .unwrap();

        let item = &mut ctx.accounts.item;

        let payment_subtotal = imprecise_number!(precise_number!(amount.into())
            .checked_mul(&precise_number!(item.price.into()))
            .ok_or(SplurgeError::MathOverflow)?
            .checked_mul(&oracle_price)
            .ok_or(SplurgeError::MathOverflow)?) as u64;

        let platform_fee = imprecise_number!(precise_number!(payment_subtotal.into())
            .checked_mul(&precise_number!(ctx.accounts.config.order_fee_bps.into()))
            .ok_or(SplurgeError::MathOverflow)?
            .checked_div(&precise_number!(MAX_FEE_BASIS_POINTS.into()))
            .ok_or(SplurgeError::MathOverflow)?) as u64;

        let order = &mut ctx.accounts.order;

        order.set_inner(Order {
            bump: ctx.bumps.order,
            shopper: ctx.accounts.shopper.key(),
            item: item.key(),
            timestamp,
            status: OrderStatus::default(),
            amount,
            payment_subtotal,
            platform_fee,
            payment_mint: payment_mint.key(),
        });

        let decimals = payment_mint.decimals;

        transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    authority: ctx.accounts.authority.to_account_info(),
                    mint: payment_mint.to_account_info(),
                    from: ctx.accounts.authority_token_account.to_account_info(),
                    to: ctx.accounts.order_token_account.to_account_info(),
                },
            ),
            payment_subtotal,
            decimals,
        )?;

        transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    authority: ctx.accounts.authority.to_account_info(),
                    mint: payment_mint.to_account_info(),
                    from: ctx.accounts.authority_token_account.to_account_info(),
                    to: ctx.accounts.treasury_token_account.to_account_info(),
                },
            ),
            platform_fee,
            decimals,
        )?;

        item.inventory_count = item
            .inventory_count
            .checked_sub(amount)
            .ok_or(SplurgeError::InsufficientInventory)?;

        emit!(OrderCreated {
            order: order.key(),
            timestamp,
        });

        Item::invariant(&item)?;
        Order::invariant(&order)
    }
}
