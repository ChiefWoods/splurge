use crate::{constants::*, error::ErrorCode, state::*};
use anchor_lang::prelude::*;

pub fn update_order(ctx: Context<UpdateOrder>, status: OrderStatus) -> Result<()> {
    let order = &mut ctx.accounts.order;

    require!(
        order.status == OrderStatus::Pending || order.status == OrderStatus::Shipping,
        ErrorCode::OrderAlreadyFinalized
    );

    order.status = status;

    Ok(())
}

#[derive(Accounts)]
pub struct UpdateOrder<'info> {
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
    #[account(mut)]
    pub order: Account<'info, Order>,
}
