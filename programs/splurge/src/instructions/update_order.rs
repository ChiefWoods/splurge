use anchor_lang::{
    prelude::*,
    solana_program::{instruction::Instruction, pubkey::PUBKEY_BYTES},
    InstructionData,
};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};
use tuktuk_program::{
    compile_transaction,
    tuktuk::cpi::{accounts::QueueTaskV0, queue_task_v0},
    types::QueueTaskArgsV0,
    TransactionSourceV0, TriggerV0,
};

use crate::{
    constants::{CONFIG_SEED, ORDER_SEED, TASK_TRIGGER_DELAY},
    error::SplurgeError,
    events::{OrderCancelled, OrderShipped},
    state::{Config, Order, OrderStatus},
    CompleteOrder, Item, Shopper, Store,
};

#[derive(Accounts)]
pub struct UpdateOrder<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
        has_one = admin @ SplurgeError::UnauthorizedAdmin,
    )]
    pub config: Account<'info, Config>,
    #[account(
        mut,
        seeds = [ORDER_SEED, shopper.key().as_ref(), item.key().as_ref(), order.timestamp.to_le_bytes().as_ref()],
        bump = order.bump,
        constraint = order.status == OrderStatus::Pending || order.status == OrderStatus::Shipping @ SplurgeError::OrderAlreadyFinalized,
    )]
    pub order: Account<'info, Order>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    #[account(mut)]
    pub authority: SystemAccount<'info>,
    pub item: Account<'info, Item>,
    #[account(mut)]
    pub order_token_account: InterfaceAccount<'info, TokenAccount>,
    pub payment_mint: InterfaceAccount<'info, Mint>,
    pub shopper: Account<'info, Shopper>,
    pub store: Account<'info, Store>,
    #[account(
        init_if_needed,
        payer = admin,
        associated_token::mint = payment_mint,
        associated_token::authority = store,
        associated_token::token_program = token_program,
    )]
    pub store_token_account: InterfaceAccount<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    /// CHECK: Tuktuk program, used in CPI
    pub tuktuk: UncheckedAccount<'info>,
    /// CHECK: Task queue, used in CPI
    #[account(mut)]
    pub task_queue: UncheckedAccount<'info>,
    /// CHECK: Task, used in CPI
    #[account(mut)]
    pub task: UncheckedAccount<'info>,
    /// CHECK: Task queue authority, used in CPI
    pub task_queue_authority: UncheckedAccount<'info>,
}

impl UpdateOrder<'_> {
    pub fn handler(ctx: Context<UpdateOrder>, status: OrderStatus, task_id: u16) -> Result<()> {
        let UpdateOrder {
            admin,
            config,
            order,
            tuktuk,
            associated_token_program,
            authority,
            item,
            order_token_account,
            payment_mint,
            shopper,
            store,
            store_token_account,
            system_program,
            token_program,
            task_queue,
            task,
            task_queue_authority,
        } = ctx.accounts;

        order.status = status;
        let timestamp = Clock::get()?.unix_timestamp;

        match status {
            OrderStatus::Shipping => {
                let (compiled_tx, _) = compile_transaction(
                    vec![Instruction {
                        program_id: crate::ID,
                        accounts: CompleteOrder {
                            admin: admin.clone(),
                            associated_token_program: associated_token_program.clone(),
                            authority: authority.clone(),
                            config: config.clone(),
                            item: item.clone(),
                            order: order.clone(),
                            order_token_account: order_token_account.clone(),
                            payment_mint: payment_mint.clone(),
                            shopper: shopper.clone(),
                            store: store.clone(),
                            store_token_account: store_token_account.clone(),
                            system_program: system_program.clone(),
                            token_program: token_program.clone(),
                        }
                        .to_account_metas(None)
                        .to_vec(),
                        data: crate::instruction::CompleteOrder.data(),
                    }],
                    vec![],
                )
                .unwrap();

                let trigger_timestamp = timestamp + TASK_TRIGGER_DELAY as i64;
                let order_key_string = order.key().to_string();
                let description = format!(
                    "Complete order {}...{} at {}",
                    &order_key_string[..4],
                    &order_key_string[PUBKEY_BYTES - 4..PUBKEY_BYTES],
                    trigger_timestamp
                );

                queue_task_v0(
                    CpiContext::new(
                        tuktuk.to_account_info(),
                        QueueTaskV0 {
                            payer: admin.to_account_info(),
                            queue_authority: admin.to_account_info(),
                            task_queue: task_queue.to_account_info(),
                            task_queue_authority: task_queue_authority.to_account_info(),
                            task: task.to_account_info(),
                            system_program: system_program.to_account_info(),
                        },
                    ),
                    QueueTaskArgsV0 {
                        trigger: TriggerV0::Timestamp(trigger_timestamp),
                        transaction: TransactionSourceV0::CompiledV0(compiled_tx),
                        crank_reward: None,
                        free_tasks: 1,
                        id: task_id,
                        description,
                    },
                )?;

                emit!(OrderShipped {
                    order: order.key(),
                    timestamp,
                });
            }
            OrderStatus::Cancelled => {
                emit!(OrderCancelled {
                    order: order.key(),
                    timestamp,
                });
            }
            _ => {
                return Err(SplurgeError::InvalidOrderStatus.into());
            }
        }

        Ok(())
    }
}
