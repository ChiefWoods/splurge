use anchor_lang::{prelude::*, Discriminator};

#[account]
pub struct Store {
    pub bump: u8,           // 1
    pub name: String,       // 4
    pub image: String,      // 4
    pub items: Vec<Pubkey>, // 4
}

impl Store {
    pub const MIN_SPACE: usize = Store::DISCRIMINATOR.len() + 1 + 4 + 4 + 4;
}
