use anchor_lang::prelude::*;

use crate::error::SplurgeError;

#[account]
pub struct Config {
    /// Address to which platform fees are sent to
    pub treasury: Pubkey, // 32
    /// Fee charged on each order in basis points
    pub order_fee_bps: u16, // 2
    /// Address that has authority over the config
    pub admin: Pubkey, // 32
    /// Boolean indicating if new orders can be created
    pub is_paused: bool, // 1
    /// Bump used for seed derivation
    pub bump: u8, // 1
    /// List of stablecoin mints accepted as payment
    pub accepted_mints: Vec<AcceptedMint>, // 4
    /// Reserved for future upgrades
    pub reserved: [u8; 64], // 64
}

impl Config {
    pub const MIN_SPACE: usize = Config::DISCRIMINATOR.len() + 32 + 2 + 32 + 1 + 1 + 4 + 64;

    pub fn space(accepted_mints: &Vec<AcceptedMint>) -> usize {
        Config::DISCRIMINATOR.len()
            + 32
            + 2
            + 32
            + 1
            + 1
            + 4
            + (AcceptedMint::INIT_SPACE * accepted_mints.len())
            + 64
    }

    pub fn validate_mint(&self, mint: Pubkey) -> Result<()> {
        require!(
            self.accepted_mints.iter().any(|m| m.mint == mint),
            SplurgeError::PaymentMintNotAccepted
        );

        Ok(())
    }

    pub fn validate_price_update_v2(&self, price_update_v2: Pubkey) -> Result<()> {
        require!(
            self.accepted_mints
                .iter()
                .any(|m| m.price_update_v2 == price_update_v2),
            SplurgeError::InvalidPriceUpdateV2
        );

        Ok(())
    }

    pub fn invariant(&self) -> Result<()> {
        require_keys_neq!(self.admin, Pubkey::default(), SplurgeError::InvalidAddress);

        require_keys_neq!(
            self.treasury,
            Pubkey::default(),
            SplurgeError::InvalidAddress
        );

        require!(
            !self.accepted_mints.is_empty(),
            SplurgeError::EmptyAcceptedMints
        );

        for accepted_mint in self.accepted_mints.iter() {
            require_keys_neq!(
                accepted_mint.mint,
                Pubkey::default(),
                SplurgeError::InvalidAddress
            );
            require_keys_neq!(
                accepted_mint.price_update_v2,
                Pubkey::default(),
                SplurgeError::InvalidAddress
            );
        }

        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, InitSpace, Clone)]
pub struct AcceptedMint {
    /// Mint address of the stablecoin
    pub mint: Pubkey,
    /// Pyth price feed account address of the stablecoin
    pub price_update_v2: Pubkey,
}
