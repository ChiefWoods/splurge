use anchor_lang::prelude::*;

use crate::{
    constants::{CONFIG_SEED, ORDER_SEED},
    error::SplurgeError,
    events::{OrderCancelled, OrderShipped},
    state::{Config, Order, OrderStatus},
};

#[derive(Accounts)]
pub struct UpdateOrder<'info> {
    pub admin: Signer<'info>,
    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
        has_one = admin @ SplurgeError::UnauthorizedAdmin,
    )]
    pub config: Account<'info, Config>,
    #[account(
        mut,
        seeds = [ORDER_SEED, order.shopper.key().as_ref(), order.item.key().as_ref(), order.timestamp.to_le_bytes().as_ref()],
        bump = order.bump,
    )]
    pub order: Account<'info, Order>,
}

impl UpdateOrder<'_> {
    pub fn handler(ctx: Context<UpdateOrder>, status: OrderStatus) -> Result<()> {
        let order = &mut ctx.accounts.order;

        require!(
            order.status == OrderStatus::Pending || order.status == OrderStatus::Shipping,
            SplurgeError::OrderAlreadyFinalized
        );

        order.status = status;
        let timestamp = Clock::get()?.unix_timestamp;

        match status {
            OrderStatus::Shipping => {
                emit!(OrderShipped {
                    order: ctx.accounts.order.key(),
                    timestamp,
                });
            }
            OrderStatus::Cancelled => {
                emit!(OrderCancelled {
                    order: ctx.accounts.order.key(),
                    timestamp,
                });
            }
            _ => {}
        }

        Ok(())
    }
}
