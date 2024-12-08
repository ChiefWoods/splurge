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
}
