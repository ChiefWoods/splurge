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

    pub fn initialize_config(ctx: Context<InitializeConfig>) -> Result<()> {
        instructions::initialize_config(ctx)
    }

    pub fn update_admin(ctx: Context<UpdateAdmin>, new_admin: Pubkey) -> Result<()> {
        instructions::update_admin(ctx, new_admin)
    }

    pub fn create_shopper(
        ctx: Context<CreateShopper>,
        name: String,
        image: String,
        address: String,
    ) -> Result<()> {
        instructions::create_shopper(ctx, name, image, address)
    }

    pub fn create_store(ctx: Context<CreateStore>, name: String, image: String) -> Result<()> {
        instructions::create_store(ctx, name, image)
    }
}
