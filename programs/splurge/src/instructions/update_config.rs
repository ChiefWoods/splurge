use anchor_lang::{prelude::*, solana_program::pubkey::PUBKEY_BYTES};

use crate::{constants::CONFIG_SEED, error::SplurgeError, state::Config};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateConfigArgs {
    pub new_admin: Option<Pubkey>,
    pub treasury: Option<Pubkey>,
    pub locked: Option<bool>,
    pub order_fee_bps: Option<u16>,
    pub whitelisted_mints: Option<Vec<Pubkey>>,
}

#[derive(Accounts)]
#[instruction(args: UpdateConfigArgs)]
pub struct UpdateConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        mut,
        realloc = Config::MIN_SPACE + (args.whitelisted_mints.as_ref().unwrap().len() * PUBKEY_BYTES),
        realloc::payer = admin,
        realloc::zero = false,
        seeds = [CONFIG_SEED],
        bump = config.bump,
        has_one = admin @ SplurgeError::UnauthorizedAdmin,
    )]
    pub config: Account<'info, Config>,
    pub system_program: Program<'info, System>,
}

impl UpdateConfig<'_> {
    pub fn update_config(ctx: Context<UpdateConfig>, args: UpdateConfigArgs) -> Result<()> {
        if let Some(new_admin) = args.new_admin {
            ctx.accounts.config.admin = new_admin;
        }

        if let Some(treasury) = args.treasury {
            ctx.accounts.config.treasury = treasury;
        }

        if let Some(locked) = args.locked {
            ctx.accounts.config.platform_locked = locked;
        }

        if let Some(order_fee_bps) = args.order_fee_bps {
            ctx.accounts.config.order_fee_bps = order_fee_bps;
        }

        if let Some(whitelisted_mints) = args.whitelisted_mints {
            ctx.accounts.config.whitelisted_mints = whitelisted_mints;
        }

        Config::invariant(&ctx.accounts.config)
    }
}
