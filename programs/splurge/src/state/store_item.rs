use anchor_lang::{prelude::*, solana_program::pubkey::PUBKEY_BYTES, Discriminator};

#[account]
pub struct StoreItem {
    pub bump: u8,             // 1
    pub inventory_count: i64, // 8
    pub price: f64,           // 8
    pub store: Pubkey,        // 32
    pub name: String,         // 4
    pub image: String,        // 4
    pub description: String,  // 4
    pub reviews: Vec<Pubkey>, // 4
}

impl StoreItem {
    pub const MIN_SPACE: usize = StoreItem::DISCRIMINATOR.len() + 1 + 8 + 8 + 32 + 4 + 4 + 4 + 4;

    pub fn get_reviews_space(&self) -> usize {
        self.reviews.len() * PUBKEY_BYTES
    }
}
