use anchor_lang::{prelude::*, Discriminator};

#[account]
pub struct Shopper {
    pub bump: u8,            // 1
    pub name: String,        // 4
    pub image: String,       // 4
    pub address: String,     // 4
    pub orders: Vec<Pubkey>, // 4
}

impl Shopper {
    pub const MIN_SPACE: usize = Shopper::DISCRIMINATOR.len() + 1 + 4 + 4 + 4 + 4;
}
