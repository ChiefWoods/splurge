use anchor_lang::prelude::*;

use crate::error::SplurgeError;

#[account]
pub struct Item {
    /// PDA of store account
    pub store: Pubkey, // 32
    /// Price in atomic units of mint with 6 decimals
    pub price: u64, // 8
    /// Remaining inventory count
    pub inventory_count: u32, // 4
    /// Bump used for seed derivation
    pub bump: u8, // 1
    /// Display name
    pub name: String, // 4
    /// Display image
    pub image: String, // 4
    /// Item description
    pub description: String, // 4
}

impl Item {
    pub fn space(name: &str, image: &str, description: &str) -> usize {
        Item::DISCRIMINATOR.len()
            + 32
            + 8
            + 4
            + 1
            + 4
            + name.len()
            + 4
            + image.len()
            + 4
            + description.len()
    }

    pub fn invariant(&self) -> Result<()> {
        require_keys_neq!(self.store, Pubkey::default(), SplurgeError::InvalidAddress);

        Ok(())
    }
}
