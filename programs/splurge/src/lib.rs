pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;
use {instructions::*, state::*};

declare_id!("SPLGqkZN8mAFsFjzMe6LZ4yeCzY6i6SGhegF9qQWaL7");

#[program]
pub mod splurge {
    use super::*;
}
