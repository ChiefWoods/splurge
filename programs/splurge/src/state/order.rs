use anchor_lang::prelude::*;
use num_derive::*;

#[account]
#[derive(InitSpace)]
pub struct Order {
    pub bump: u8,             // 1
    pub status: OrderStatus,  // 1 + 1
    pub timestamp: i64,       // 8
    pub amount: i64,          // 8
    pub total_usd: f64,       // 8
    pub payment_mint: Pubkey, // 32
    pub shopper: Pubkey,      // 32
    pub store_item: Pubkey,   // 32
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
