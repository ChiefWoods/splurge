use anchor_lang::{prelude::*, Discriminator};

use crate::error::SplurgeError;

#[account]
pub struct Store {
    /// Bump used for seed derivation
    pub bump: u8, // 1
    /// Address that has authority over the account
    pub authority: Pubkey, // 32
    /// Display name
    pub name: String, // 4
    /// Display image
    pub image: String, // 4
    /// Store description
    pub about: String, // 4
}

impl Store {
    pub const MIN_SPACE: usize = Store::DISCRIMINATOR.len() + 1 + 32 + 4 + 4 + 4;

    pub fn invariant(&self) -> Result<()> {
        require_keys_neq!(
            self.authority,
            Pubkey::default(),
            SplurgeError::InvalidAddress
        );

        Ok(())
    }
}
