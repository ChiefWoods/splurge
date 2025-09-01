use anchor_lang::prelude::*;

use crate::{constants::CONFIG_SEED, error::SplurgeError, state::Config, AcceptedMint};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateConfigArgs {
    pub new_admin: Option<Pubkey>,
    pub is_paused: Option<bool>,
    pub order_fee_bps: Option<u16>,
    pub accepted_mints: Option<Vec<AcceptedMint>>,
}

#[derive(Accounts)]
#[instruction(args: UpdateConfigArgs)]
pub struct UpdateConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        mut,
        realloc = if args.accepted_mints.is_some() {
            Config::space(args.accepted_mints.as_ref().unwrap())
        } else {
            config.to_account_info().data_len()
        },
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
    pub fn handler(ctx: Context<UpdateConfig>, args: UpdateConfigArgs) -> Result<()> {
        let UpdateConfigArgs {
            new_admin,
            is_paused,
            order_fee_bps,
            accepted_mints,
        } = args;

        let UpdateConfig { config, .. } = ctx.accounts;

        if let Some(new_admin) = new_admin {
            config.admin = new_admin;
        }

        if let Some(is_paused) = is_paused {
            config.is_paused = is_paused;
        }

        if let Some(order_fee_bps) = order_fee_bps {
            config.order_fee_bps = order_fee_bps;
        }

        if let Some(mut accepted_mints) = accepted_mints {
            accepted_mints.dedup_by(|a, b| a.mint == b.mint);

            config.accepted_mints = accepted_mints;
        }

        Config::invariant(&config)
    }
}
