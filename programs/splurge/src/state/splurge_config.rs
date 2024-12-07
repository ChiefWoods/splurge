use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct SplurgeConfig {
    pub bump: u8,      // 1
    pub admin: Pubkey, // 32
}
