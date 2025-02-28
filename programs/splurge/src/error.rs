use anchor_lang::prelude::*;

#[error_code]
pub enum SplurgeError {
    #[msg("Address cannot be default")]
    InvalidAddress,
    #[msg("Timestamp cannot be in the future")]
    InvalidTimestamp,
    #[msg("Whitelist cannot be empty")]
    EmptyWhitelist = 100,
    #[msg("Signer not authorized")]
    UnauthorizedAdmin,
    #[msg("Platform locked, no new orders can be created")]
    PlatformLocked,
    #[msg("Payment mint is not whitelisted")]
    MintNotWhitelisted,
    #[msg("Shopper name is required")]
    ShopperNameRequired = 200,
    #[msg("Shopper name exceeded maximum length")]
    ShopperNameTooLong,
    #[msg("Shopper image is required")]
    ShopperImageRequired,
    #[msg("Shopper address is required")]
    ShopperAddressRequired,
    #[msg("Store name is required")]
    StoreNameRequired = 300,
    #[msg("Store name exceeded maximum length")]
    StoreNameTooLong,
    #[msg("Store image is required")]
    StoreImageRequired,
    #[msg("Store item name is required")]
    ItemNameRequired = 400,
    #[msg("Store item name exceeded maximum length")]
    ItemNameTooLong,
    #[msg("Store item image is required")]
    ItemImageRequired,
    #[msg("Order total is does not match product of item price and amount")]
    IncorrectOrderTotal = 500,
    #[msg("Store item has insufficient inventory to fulfill order")]
    InsufficientInventory,
    #[msg("Order already finalized")]
    OrderAlreadyFinalized,
    #[msg("Order is not in shipping status")]
    OrderNotBeingShipped,
    #[msg("Order already completed")]
    OrderAlreadyCompleted,
    #[msg("Order not completed")]
    OrderNotCompleted,
    #[msg("Rating must be between 1 and 5")]
    InvalidRating = 600,
}
