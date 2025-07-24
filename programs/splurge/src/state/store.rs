use anchor_lang::prelude::*;

use crate::error::SplurgeError;

#[account]
pub struct Store {
    /// Address that has authority over the account
    pub authority: Pubkey, // 32
    /// Bump used for seed derivation
    pub bump: u8, // 1
    /// Display name
    pub name: String, // 4
    /// Display image
    pub image: String, // 4
    /// Store description
    pub about: String, // 4
}

impl Store {
    pub fn space(name: &str, image: &str, about: &str) -> usize {
        Store::DISCRIMINATOR.len() + 32 + 1 + 4 + name.len() + 4 + image.len() + 4 + about.len()
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
