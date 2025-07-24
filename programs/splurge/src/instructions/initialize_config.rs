use anchor_lang::prelude::*;

use crate::{constants::CONFIG_SEED, state::Config, AcceptedMint};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializeConfigArgs {
    pub admin: Pubkey,
    pub treasury: Pubkey,
    pub order_fee_bps: u16,
    pub accepted_mints: Vec<AcceptedMint>,
}

#[derive(Accounts)]
#[instruction(args: InitializeConfigArgs)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = Config::space(args.accepted_mints.as_ref()),
        seeds = [CONFIG_SEED],
        bump,
    )]
    pub config: Account<'info, Config>,
    pub system_program: Program<'info, System>,
}

impl InitializeConfig<'_> {
    pub fn handler(ctx: Context<InitializeConfig>, args: InitializeConfigArgs) -> Result<()> {
        let InitializeConfigArgs {
            admin,
            treasury,
            order_fee_bps,
            mut accepted_mints,
        } = args;

        accepted_mints.dedup_by(|a, b| a.mint == b.mint);

        ctx.accounts.config.set_inner(Config {
            bump: ctx.bumps.config,
            admin,
            treasury,
            is_paused: false,
            order_fee_bps,
            accepted_mints,
            reserved: [0; 64],
        });

        Config::invariant(&ctx.accounts.config)
    }
}
