use anchor_lang::prelude::*;

use crate::error::SplurgeError;

#[account]
pub struct Shopper {
    /// Bump used for seed derivation
    pub bump: u8, // 1
    /// Address that has authority over the account
    pub authority: Pubkey, // 32
    /// Display name
    pub name: String, // 4
    /// Profile image
    pub image: String, // 4
    /// Delivery address
    pub address: String, // 4
}

impl Shopper {
    pub const MIN_SPACE: usize = Shopper::DISCRIMINATOR.len() + 1 + 32 + 4 + 4 + 4;

    pub fn invariant(&self) -> Result<()> {
        require_keys_neq!(
            self.authority,
            Pubkey::default(),
            SplurgeError::InvalidAddress
        );

        Ok(())
    }
}
