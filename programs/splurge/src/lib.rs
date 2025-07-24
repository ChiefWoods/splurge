pub mod constants;
pub mod error;
pub mod events;
pub mod instructions;
pub mod macros;
pub mod state;

use anchor_lang::prelude::*;

pub use instructions::*;
pub use state::*;

declare_id!("EbjBQN91GCKvTsgKqj9GyK27qDionoUEmZWtpDazM1zj");

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

    pub fn initialize_shopper(
        ctx: Context<InitializeShopper>,
        args: InitializeShopperArgs,
    ) -> Result<()> {
        InitializeShopper::handler(ctx, args)
    }

    pub fn initialize_store(
        ctx: Context<InitializeStore>,
        args: InitializeStoreArgs,
    ) -> Result<()> {
        InitializeStore::handler(ctx, args)
    }

    pub fn list_item(ctx: Context<ListItem>, args: ListItemArgs) -> Result<()> {
        ListItem::handler(ctx, args)
    }

    pub fn update_item(ctx: Context<UpdateItem>, args: UpdateItemArgs) -> Result<()> {
        UpdateItem::handler(ctx, args)
    }

    pub fn unlist_item(ctx: Context<UnlistItem>) -> Result<()> {
        UnlistItem::handler(ctx)
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
