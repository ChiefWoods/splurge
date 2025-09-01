use anchor_lang::prelude::*;

#[error_code]
pub enum SplurgeError {
    #[msg("Address cannot be default pubkey")]
    InvalidAddress,
    #[msg("Timestamp cannot be in the future")]
    InvalidTimestamp,
    #[msg("Whitelist cannot be empty")]
    EmptyAcceptedMints,
    #[msg("Signer not authorized as config admin")]
    UnauthorizedAdmin,
    #[msg("Platform paused, no new orders can be created")]
    PlatformPaused,
    #[msg("Payment mint is not accepted")]
    PaymentMintNotAccepted,
    #[msg("Price update v2 does not match with any accepted mint")]
    InvalidPriceUpdateV2,
    #[msg("Shopper name is required")]
    ShopperNameRequired,
    #[msg("Shopper name exceeded maximum length")]
    ShopperNameTooLong,
    #[msg("Shopper address is required")]
    ShopperAddressRequired,
    #[msg("Shopper authority does not match provided authority")]
    InvalidShopperAuthority,
    #[msg("Store name is required")]
    StoreNameRequired,
    #[msg("Store name exceeded maximum length")]
    StoreNameTooLong,
    #[msg("Store item name is required")]
    ItemNameRequired,
    #[msg("Store item name exceeded maximum length")]
    ItemNameTooLong,
    #[msg("Store item has insufficient inventory to fulfill order")]
    InsufficientInventory,
    #[msg("Order already finalized")]
    OrderAlreadyFinalized,
    #[msg("Order status is not pending")]
    OrderNotPending,
    #[msg("Order status is not shipping")]
    OrderNotBeingShipped,
    #[msg("Order already completed")]
    OrderAlreadyCompleted,
    #[msg("Order not completed")]
    OrderNotCompleted,
    #[msg("Order completion must be done through complete_order instruction")]
    InvalidOrderStatus,
    #[msg("Order payment mint does not match provided mint")]
    InvalidOrderPaymentMint,
    #[msg("Rating must be between 1 and 5")]
    InvalidRating,
    #[msg("Math operation overflow")]
    MathOverflow,
    #[msg("Oracle price must be above 0")]
    InvalidPrice,
}
