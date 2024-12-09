pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;
use instructions::*;

declare_id!("SPLGqkZN8mAFsFjzMe6LZ4yeCzY6i6SGhegF9qQWaL7");

#[program]
pub mod splurge {
    use super::*;

    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        whitelisted_mints: Vec<Pubkey>,
    ) -> Result<()> {
        instructions::initialize_config(ctx, whitelisted_mints)
    }

    pub fn set_admin(ctx: Context<SetAdmin>, new_admin: Pubkey) -> Result<()> {
        instructions::set_admin(ctx, new_admin)
    }

    pub fn add_whitelisted_mint(
        ctx: Context<AddWhitelistedMint>,
        mints: Vec<Pubkey>,
    ) -> Result<()> {
        instructions::add_whitelisted_mint(ctx, mints)
    }

    pub fn remove_whitelisted_mint(
        ctx: Context<RemoveWhitelistedMint>,
        mints: Vec<Pubkey>,
    ) -> Result<()> {
        instructions::remove_whitelisted_mint(ctx, mints)
    }

    pub fn create_shopper(
        ctx: Context<CreateShopper>,
        name: String,
        image: String,
        address: String,
    ) -> Result<()> {
        instructions::create_shopper(ctx, name, image, address)
    }

    pub fn create_store(
        ctx: Context<CreateStore>,
        name: String,
        image: String,
        about: String,
    ) -> Result<()> {
        instructions::create_store(ctx, name, image, about)
    }

    pub fn update_store(
        ctx: Context<UpdateStore>,
        name: String,
        image: String,
        about: String,
    ) -> Result<()> {
        instructions::update_store(ctx, name, image, about)
    }

    pub fn create_item(
        ctx: Context<CreateItem>,
        name: String,
        image: String,
        description: String,
        inventory_count: i64,
        price: f64,
    ) -> Result<()> {
        instructions::create_item(ctx, name, image, description, inventory_count, price)
    }

    pub fn update_item(
        ctx: Context<UpdateItem>,
        name: String,
        inventory_count: i64,
        price: f64,
    ) -> Result<()> {
        instructions::update_item(ctx, name, inventory_count, price)
    }

    pub fn delete_item(ctx: Context<DeleteItem>, name: String) -> Result<()> {
        instructions::delete_item(ctx, name)
    }

    pub fn create_order(
        ctx: Context<CreateOrder>,
        timestamp: i64,
        amount: i64,
        total_usd: f64,
    ) -> Result<()> {
        instructions::create_order(ctx, timestamp, amount, total_usd)
    }
}
