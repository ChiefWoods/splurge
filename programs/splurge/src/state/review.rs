use anchor_lang::prelude::*;

use crate::error::SplurgeError;

#[account]
pub struct Review {
    /// Bump used for seed derivation
    pub bump: u8, // 1
    /// PDA of order account
    pub order: Pubkey, // 32
    /// Rating of review, on a scale of 1 - 5
    pub rating: u8, // 1
    /// Unix time of review creation
    pub timestamp: i64, // 8
    /// Review text
    pub text: String, // 4
}

impl Review {
    pub const MIN_SPACE: usize = Review::DISCRIMINATOR.len() + 1 + 32 + 1 + 8 + 4;

    pub fn invariant(&self) -> Result<()> {
        require_keys_neq!(self.order, Pubkey::default(), SplurgeError::InvalidAddress);

        Ok(())
    }
}
