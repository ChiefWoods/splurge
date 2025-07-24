use anchor_lang::prelude::*;
use num_derive::*;

use crate::error::SplurgeError;

#[account]
#[derive(InitSpace)]
pub struct Order {
    /// PDA of shopper account
    pub shopper: Pubkey, // 32
    /// PDA of item account
    pub item: Pubkey, // 32
    /// Unix time of order creation
    pub timestamp: i64, // 8
    /// Order status
    pub status: OrderStatus, // 1
    /// Amount of item purchased
    pub amount: u32, // 4
    /// Payment subtotal in atomic units of mint
    pub payment_subtotal: u64, // 8
    /// Platform fee in atomic units of mint
    pub platform_fee: u64, // 8
    /// Address of stablecoin mint used for payment
    pub payment_mint: Pubkey, // 32
    /// Bump used for seed derivation
    pub bump: u8, // 1
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
