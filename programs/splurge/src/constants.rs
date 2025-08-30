use anchor_lang::prelude::*;

#[constant]
pub const CONFIG_SEED: &[u8] = b"config";
#[constant]
pub const SHOPPER_SEED: &[u8] = b"shopper";
#[constant]
pub const STORE_SEED: &[u8] = b"store";
#[constant]
pub const ITEM_SEED: &[u8] = b"item";
#[constant]
pub const ORDER_SEED: &[u8] = b"order";
#[constant]
pub const REVIEW_SEED: &[u8] = b"review";
#[constant]
pub const MAX_SHOPPER_NAME_LEN: u8 = 64;
#[constant]
pub const MAX_STORE_NAME_LEN: u8 = 64;
#[constant]
pub const MAX_ITEM_NAME_LEN: u8 = 32;
#[constant]
pub const MAX_ORACLE_STALENESS: u8 = 60;
