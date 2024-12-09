use anchor_lang::{prelude::*, Discriminator};

#[account]
pub struct Review {
    pub bump: u8,       // 1
    pub rating: i8,     // 1
    pub timestamp: i64, // 8
    pub order: Pubkey,  // 32
    pub text: String,   // 4
}

impl Review {
    pub const MIN_SPACE: usize = Review::DISCRIMINATOR.len() + 1 + 1 + 8 + 32 + 4;
}
