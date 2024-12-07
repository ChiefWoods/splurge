use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Incorrect program data address")]
    IncorrectProgramDataAddress,
    #[msg("Signer not authorized")]
    UnauthorizedAdmin,
    #[msg("Admin is already assigned")]
    AdminAlreadyAssigned,
}
