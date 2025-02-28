use anchor_lang::prelude::*;

#[event]
pub struct ItemCreated {
    pub store: Pubkey,
}

#[event]
pub struct OrderCreated {
    pub store: Pubkey,
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
