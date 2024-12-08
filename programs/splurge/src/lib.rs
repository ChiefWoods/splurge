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

    pub fn add_item(
        ctx: Context<AddItem>,
        name: String,
        image: String,
        inventory_count: i64,
        price: f64,
    ) -> Result<()> {
        instructions::add_item(ctx, name, image, inventory_count, price)
    }
}
