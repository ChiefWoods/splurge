#[macro_export]
macro_rules! precise_number {
    ($value: expr) => {
        spl_math::precise_number::PreciseNumber::new($value).unwrap()
    };
}

#[macro_export]
macro_rules! imprecise_number {
    ($precise_number: expr) => {
        $precise_number.to_imprecise().unwrap()
    };
}

#[macro_export]
macro_rules! treasury_signer {
    ($bump: expr) => {
        &[TREASURY_SEED, &[$bump]]
    };
}

#[macro_export]
macro_rules! shopper_signer {
    ($authority_key: expr, $bump: expr) => {
        &[SHOPPER_SEED, $authority_key.as_ref(), &[$bump]]
    };
}

#[macro_export]
macro_rules! store_signer {
    ($authority_key: expr, $bump: expr) => {
        &[STORE_SEED, $authority_key.as_ref(), &[$bump]]
    };
}

#[macro_export]
macro_rules! order_signer {
    ($shopper_key: expr, $item_key: expr, $order_timestamp: expr, $bump: expr) => {
        &[
            ORDER_SEED,
            $shopper_key.as_ref(),
            $item_key.as_ref(),
            $order_timestamp.as_ref(),
            &[$bump],
        ]
    };
}
