use anchor_lang::prelude::*;
use num_derive::*;

use crate::error::SplurgeError;

#[account]
#[derive(InitSpace)]
pub struct Order {
    /// Bump used for seed derivation
    pub bump: u8, // 1
    /// PDA of shopper account
    pub shopper: Pubkey, // 32
    /// PDA of item account
    pub item: Pubkey, // 32
    /// Unix time of order creation
    pub timestamp: i64, // 8
    /// Order status
    pub status: OrderStatus, // 1 + 1
    /// Amount of item purchased
    pub amount: u32, // 4
    /// Order total in USD cents
    pub total: u32, // 4
    /// Address of stablecoin token used for payment
    pub payment_mint: Pubkey, // 32
}

#[derive(
    AnchorSerialize,
    AnchorDeserialize,
    FromPrimitive,
    ToPrimitive,
    Copy,
    Clone,
    PartialEq,
    Eq,
    Default,
    InitSpace,
)]
pub enum OrderStatus {
    #[default]
    Pending,
    Shipping,
    Cancelled,
    Completed,
}

impl Order {
    pub fn invariant(&self) -> Result<()> {
        require_keys_neq!(
            self.shopper,
            Pubkey::default(),
            SplurgeError::InvalidAddress
        );
        require_keys_neq!(self.item, Pubkey::default(), SplurgeError::InvalidAddress);
        require_keys_neq!(
            self.payment_mint,
            Pubkey::default(),
            SplurgeError::InvalidAddress
        );
        require_gte!(
            Clock::get()?.unix_timestamp,
            self.timestamp,
            SplurgeError::InvalidTimestamp
        );

        Ok(())
    }
}
