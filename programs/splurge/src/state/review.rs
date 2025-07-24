use anchor_lang::prelude::*;

use crate::error::SplurgeError;

#[account]
pub struct Review {
    /// PDA of order account
    pub order: Pubkey, // 32
    /// Rating of review, on a scale of 1 - 5
    pub rating: u8, // 1
    /// Unix time of review creation
    pub timestamp: i64, // 8
    /// Bump used for seed derivation
    pub bump: u8, // 1
    /// Review text
    pub text: String, // 4
}

impl Review {
    pub fn space(text: &str) -> usize {
        Review::DISCRIMINATOR.len() + 32 + 1 + 8 + 1 + 4 + text.len()
    }

    pub fn invariant(&self) -> Result<()> {
        require_keys_neq!(self.order, Pubkey::default(), SplurgeError::InvalidAddress);

        Ok(())
    }
}
