use anchor_lang::prelude::*;

#[event]
pub struct StoreInitialized {
    pub store: Pubkey,
    pub authority: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct ShopperInitialized {
    pub shopper: Pubkey,
    pub authority: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct ItemListed {
    pub item: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct OrderCreated {
    pub order: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct OrderShipped {
    pub order: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct OrderCancelled {
    pub order: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct OrderCompleted {
    pub order: Pubkey,
    pub timestamp: i64,
}
