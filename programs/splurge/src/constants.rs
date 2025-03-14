use anchor_lang::prelude::*;

#[constant]
pub const CONFIG_SEED: &[u8] = b"config";
pub const SHOPPER_SEED: &[u8] = b"shopper";
pub const STORE_SEED: &[u8] = b"store";
pub const ITEM_SEED: &[u8] = b"item";
pub const ORDER_SEED: &[u8] = b"order";
pub const REVIEW_SEED: &[u8] = b"review";
pub const MAX_BASIS_POINTS: u16 = 10000;
pub const PRICE_SCALE_FACTOR: u8 = 100;
pub const MAX_SHOPPER_NAME_LEN: usize = 64;
pub const MAX_STORE_NAME_LEN: usize = 64;
pub const MAX_STORE_ITEM_NAME_LEN: usize = 32;
