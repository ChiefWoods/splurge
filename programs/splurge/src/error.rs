use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Incorrect program data address")]
    IncorrectProgramDataAddress,
    #[msg("Signer not authorized")]
    UnauthorizedAdmin,
    #[msg("Admin is already assigned")]
    AdminAlreadyAssigned,
    #[msg("Mint is already whitelisted")]
    MintAlreadyWhitelisted,
    #[msg("Mint is not whitelisted")]
    MintNotWhitelisted,
    #[msg("Shopper name is required")]
    ShopperNameRequired = 100,
    #[msg("Shopper name exceeded maximum length")]
    ShopperNameTooLong,
    #[msg("Shopper image is required")]
    ShopperImageRequired,
    #[msg("Shopper address is required")]
    ShopperAddressRequired,
    #[msg("Store name is required")]
    StoreNameRequired = 200,
    #[msg("Store name exceeded maximum length")]
    StoreNameTooLong,
    #[msg("Store image is required")]
    StoreImageRequired,
    #[msg("Store item name is required")]
    StoreItemNameRequired = 300,
    #[msg("Store item name exceeded maximum length")]
    StoreItemNameTooLong,
    #[msg("Store item image is required")]
    StoreItemImageRequired,
    #[msg("Payment mint is not whitelisted")]
    PaymentMintNotWhitelisted = 400,
    #[msg("Order amount must be greater than 0")]
    OrderAmountInvalid,
    #[msg("Order total must be at least 0")]
    OrderTotalInvalid,
    #[msg("Order total is incorrect")]
    OrderTotalIncorrect,
    #[msg("Store item has insufficient inventory to fulfill order")]
    InsufficientInventory,
    #[msg("Order already finalized")]
    OrderAlreadyFinalized,
    #[msg("Order is not in shipping status")]
    OrderNotShipping,
    #[msg("Order already completed")]
    OrderAlreadyCompleted,
    #[msg("Order not completed")]
    OrderNotCompleted = 500,
    #[msg("Rating must be between 1 and 5")]
    ReviewRatingInvalid,
    #[msg("Review for order already exists")]
    ReviewForOrderAlreadyExists,
}
