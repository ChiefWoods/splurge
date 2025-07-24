use anchor_lang::prelude::*;

use crate::error::SplurgeError;

#[account]
pub struct Shopper {
    /// Address that has authority over the account
    pub authority: Pubkey, // 32
    /// Bump used for seed derivation
    pub bump: u8, // 1
    /// Display name
    pub name: String, // 4
    /// Profile image
    pub image: String, // 4
    /// Delivery address
    pub address: String, // 4
}

impl Shopper {
    pub fn space(name: &str, image: &str, address: &str) -> usize {
        Shopper::DISCRIMINATOR.len() + 32 + 1 + 4 + name.len() + 4 + image.len() + 4 + address.len()
    }

    pub fn invariant(&self) -> Result<()> {
        require_keys_neq!(
            self.authority,
            Pubkey::default(),
            SplurgeError::InvalidAddress
        );

        Ok(())
    }
}
