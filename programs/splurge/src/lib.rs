pub mod constants;
pub mod error;
pub mod events;
pub mod instructions;
pub mod state;
pub mod utils;

use anchor_lang::prelude::*;
use {instructions::*, state::*};

declare_id!("SPLGVMqZKru49vJQrB85vvztwSBriA7Fnw8sLHc5mEq");

#[program]
pub mod splurge {
    use super::*;

    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        args: InitializeConfigArgs,
    ) -> Result<()> {
        InitializeConfig::initialize_config(ctx, args)
    }

    pub fn update_config(ctx: Context<UpdateConfig>, args: UpdateConfigArgs) -> Result<()> {
        UpdateConfig::update_config(ctx, args)
    }

    pub fn create_shopper(ctx: Context<CreateShopper>, args: CreateShopperArgs) -> Result<()> {
        CreateShopper::create_shopper(ctx, args)
    }

    pub fn create_store(ctx: Context<CreateStore>, args: CreateStoreArgs) -> Result<()> {
        CreateStore::create_store(ctx, args)
    }

    #[access_control(CreateItem::validate_name(&args.name))]
    pub fn create_item(ctx: Context<CreateItem>, args: CreateItemArgs) -> Result<()> {
        CreateItem::create_item(ctx, args)
    }

    pub fn update_item(ctx: Context<UpdateItem>, args: UpdateItemArgs) -> Result<()> {
        UpdateItem::update_item(ctx, args)
    }

    pub fn delete_item(ctx: Context<DeleteItem>) -> Result<()> {
        DeleteItem::delete_item(ctx)
    }

    pub fn create_order(ctx: Context<CreateOrder>, args: CreateOrderArgs) -> Result<()> {
        CreateOrder::create_order(ctx, args)
    }

    pub fn update_order(ctx: Context<UpdateOrder>, status: OrderStatus) -> Result<()> {
        UpdateOrder::update_order(ctx, status)
    }

    pub fn complete_order(ctx: Context<CompleteOrder>) -> Result<()> {
        CompleteOrder::complete_order(ctx)
    }

    pub fn create_review(ctx: Context<CreateReview>, args: CreateReviewArgs) -> Result<()> {
        CreateReview::create_review(ctx, args)
    }

    pub fn withdraw_earnings(ctx: Context<WithdrawEarnings>) -> Result<()> {
        WithdrawEarnings::withdraw_earnings(ctx)
    }
}
