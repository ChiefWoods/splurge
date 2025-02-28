use anchor_lang::{prelude::*, Discriminator};

use crate::error::SplurgeError;

#[account]
pub struct Item {
    /// Bump used for seed derivation
    pub bump: u8, // 1
    /// PDA of store account
    pub store: Pubkey, // 32
    /// Price in USD cents
    pub price: u32, // 4
    /// Remaining inventory count
    pub inventory_count: u32, // 4
    /// Display name
    pub name: String, // 4
    /// Display image
    pub image: String, // 4
    /// Item description
    pub description: String, // 4
}

impl Item {
    pub const MIN_SPACE: usize = Item::DISCRIMINATOR.len() + 1 + 32 + 4 + 4 + 4 + 4 + 4;

    pub fn invariant(&self) -> Result<()> {
        require_keys_neq!(self.store, Pubkey::default(), SplurgeError::InvalidAddress);

        Ok(())
    }
}
