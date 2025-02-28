use anchor_lang::{prelude::*, solana_program::pubkey::PUBKEY_BYTES};

use crate::{constants::CONFIG_SEED, state::Config};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializeConfigArgs {
    pub admin: Pubkey,
    pub treasury: Pubkey,
    pub order_fee_bps: u16,
    pub whitelisted_mints: Vec<Pubkey>,
}

#[derive(Accounts)]
#[instruction(args: InitializeConfigArgs)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = Config::MIN_SPACE + (args.whitelisted_mints.len() * PUBKEY_BYTES),
        seeds = [CONFIG_SEED],
        bump,
    )]
    pub config: Account<'info, Config>,
    pub system_program: Program<'info, System>,
}

impl InitializeConfig<'_> {
    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        args: InitializeConfigArgs,
    ) -> Result<()> {
        ctx.accounts.config.set_inner(Config {
            bump: ctx.bumps.config,
            admin: args.admin,
            treasury: args.treasury,
            platform_locked: false,
            order_fee_bps: args.order_fee_bps,
            whitelisted_mints: args.whitelisted_mints,
            reserved: [0; 64],
        });

        Config::invariant(&ctx.accounts.config)
    }
}
