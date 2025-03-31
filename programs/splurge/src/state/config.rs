use anchor_lang::prelude::*;

use crate::error::SplurgeError;

#[account]
pub struct Config {
    /// Bump used for seed derivation
    pub bump: u8, // 1
    /// Address that has authority over the config
    pub admin: Pubkey, // 32
    /// Address to which platform fees are sent to
    pub treasury: Pubkey, // 32
    /// Boolean indicating if new orders can be created
    pub platform_locked: bool, // 1
    /// Fee charged on each order in basis points
    pub order_fee_bps: u16, // 2
    /// List of stablecoin tokens accepted as payment
    pub whitelisted_mints: Vec<Pubkey>, // 4
    /// Reserved for future upgrades
    pub reserved: [u8; 64], // 64
}

impl Config {
    pub const MIN_SPACE: usize = Config::DISCRIMINATOR.len() + 1 + 32 + 32 + 1 + 2 + 4 + 64;

    pub fn invariant(&self) -> Result<()> {
        require_keys_neq!(self.admin, Pubkey::default(), SplurgeError::InvalidAddress);

        require_keys_neq!(
            self.treasury,
            Pubkey::default(),
            SplurgeError::InvalidAddress
        );

        require!(
            !self.whitelisted_mints.is_empty(),
            SplurgeError::EmptyWhitelist
        );

        for mint in self.whitelisted_mints.iter() {
            require_keys_neq!(*mint, Pubkey::default(), SplurgeError::InvalidAddress);
        }

        Ok(())
    }
}
