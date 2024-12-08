use anchor_lang::{prelude::*, Discriminator};

#[account]
pub struct SplurgeConfig {
    pub bump: u8,                       // 1
    pub admin: Pubkey,                  // 32
    pub whitelisted_mints: Vec<Pubkey>, // 4
}

impl SplurgeConfig {
    pub const MIN_SPACE: usize = SplurgeConfig::DISCRIMINATOR.len() + 1 + 32 + 4;
}
