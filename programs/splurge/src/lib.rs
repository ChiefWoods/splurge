pub mod constants;
pub mod error;
pub mod events;
pub mod instructions;
#[doc(hidden)]
pub mod macros;
pub mod state;

use anchor_lang::prelude::*;

pub use instructions::*;

declare_id!("SPLGn8gSbch6dmHL4Z4HBFc2kCbSpFUMxXZPF2XC3Nd");

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

    pub fn create_order(ctx: Context<CreateOrder>, amount: u32, timestamp: i64) -> Result<()> {
        CreateOrder::handler(ctx, amount, timestamp)
    }

    pub fn ship_order(ctx: Context<ShipOrder>, task_id: u16) -> Result<()> {
        ShipOrder::handler(ctx, task_id)
    }

    pub fn cancel_order(ctx: Context<CancelOrder>) -> Result<()> {
        CancelOrder::handler(ctx)
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

    pub fn withdraw_treasury(ctx: Context<WithdrawTreasury>) -> Result<()> {
        WithdrawTreasury::handler(ctx)
    }
}
