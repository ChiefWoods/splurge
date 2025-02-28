use crate::constants::{MAX_BASIS_POINTS, PRICE_SCALE_FACTOR};

pub fn get_total_in_atomic(total: u32, decimals: u8) -> u64 {
    total
        .checked_mul(10_u32.pow(decimals as u32))
        .unwrap()
        .checked_div(PRICE_SCALE_FACTOR as u32)
        .unwrap() as u64
}

pub fn get_order_fee_in_atomic(total_in_atomic: u64, order_fee_bps: u16) -> u64 {
    total_in_atomic
        .checked_mul(order_fee_bps as u64)
        .unwrap()
        .checked_div(MAX_BASIS_POINTS as u64)
        .unwrap()
}
