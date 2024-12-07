use anchor_lang::prelude::*;

#[constant]
pub const SPLURGE_CONFIG_SEED: &[u8] = b"splurge_config";
pub const SHOPPER_SEED: &[u8] = b"shopper";
pub const STORE_SEED: &[u8] = b"store";
pub const MAX_SHOPPER_NAME_LEN: usize = 64;
pub const MAX_STORE_NAME_LEN: usize = 64;
