pub mod constants;
pub mod error;
pub mod events;
pub mod instructions;
pub mod state;
pub mod utils;

use anchor_lang::prelude::*;
use {instructions::*, state::*};

declare_id!("4Vgt9GWkVtW5Pf8MNfGQYEVYRiAyen4QWnCXH5jeXnft");

#[program]
pub mod splurge {
    use super::*;

    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        args: InitializeConfigArgs,
    ) -> Result<()> {
        InitializeConfig::handler(ctx, args)
    }

    pub fn update_config(ctx: Context<UpdateConfig>, args: UpdateConfigArgs) -> Result<()> {
        UpdateConfig::handler(ctx, args)
    }

    pub fn create_shopper(ctx: Context<CreateShopper>, args: CreateShopperArgs) -> Result<()> {
        CreateShopper::handler(ctx, args)
    }

    pub fn create_store(ctx: Context<CreateStore>, args: CreateStoreArgs) -> Result<()> {
        CreateStore::handler(ctx, args)
    }

    pub fn create_item(ctx: Context<CreateItem>, args: CreateItemArgs) -> Result<()> {
        CreateItem::handler(ctx, args)
    }

    pub fn update_item(ctx: Context<UpdateItem>, args: UpdateItemArgs) -> Result<()> {
        UpdateItem::handler(ctx, args)
    }

    pub fn delete_item(ctx: Context<DeleteItem>) -> Result<()> {
        DeleteItem::handler(ctx)
    }

    pub fn create_order(ctx: Context<CreateOrder>, args: CreateOrderArgs) -> Result<()> {
        CreateOrder::handler(ctx, args)
    }

    pub fn update_order(ctx: Context<UpdateOrder>, status: OrderStatus) -> Result<()> {
        UpdateOrder::handler(ctx, status)
    }

    pub fn complete_order(ctx: Context<CompleteOrder>) -> Result<()> {
        CompleteOrder::handler(ctx)
    }

    pub fn create_review(ctx: Context<CreateReview>, args: CreateReviewArgs) -> Result<()> {
        CreateReview::handler(ctx, args)
    }

    pub fn withdraw_earnings(ctx: Context<WithdrawEarnings>) -> Result<()> {
        WithdrawEarnings::handler(ctx)
    }
}
