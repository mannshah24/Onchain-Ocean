use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, MintTo, SetAuthority},
};
use anchor_spl::token::spl_token::instruction::AuthorityType;

declare_id!("BfZLHQYYggHG3gyiEU4Yd8yFxpSdQM6Tyat7QcX6z8nf");

// ─── Constants ───────────────────────────────────────────────────────────────
/// Maximum length for the external dynamic API data URI (e.g. metadata links).
const MAX_URI_LEN: usize = 64;

// ─── Program ─────────────────────────────────────────────────────────────────
#[program]
pub mod onchain_ocean {
    use super::*;

    /// Registers a new user on the Onchain Ocean, mints a registration NFT, 
    /// and initializes their UserProfile PDA with metrics and metadata.
    pub fn register_user(
        ctx: Context<RegisterUser>,
        transaction_count: u32,
        contract_types: u64,
        onchain_data_uri: String,
    ) -> Result<()> {
        let user_profile = &mut ctx.accounts.user_profile;
        
        // Validate inputs
        require!(
            onchain_data_uri.len() <= MAX_URI_LEN,
            OnchainOceanError::UriTooLong
        );

        // Populate the user profile PDA state
        user_profile.authority = ctx.accounts.user.key();
        user_profile.nft_mint = ctx.accounts.nft_mint.key();
        user_profile.registered_at = Clock::get()?.unix_timestamp;
        user_profile.message_count = 0;
        user_profile.last_message_time = 0;
        user_profile.transaction_count = transaction_count;
        user_profile.contract_types = contract_types;
        user_profile.onchain_data_uri = onchain_data_uri;
        user_profile.bump = ctx.bumps.user_profile;

        // Minting the NFT to the user's ATA
        let seeds = &[
            b"user-profile",
            ctx.accounts.user.key.as_ref(),
            &[ctx.bumps.user_profile],
        ];
        let signer_seeds = &[&seeds[..]];

        // 1. Mint 1 token (representing the NFT)
        let mint_to_accounts = MintTo {
            mint: ctx.accounts.nft_mint.to_account_info(),
            to: ctx.accounts.nft_token_account.to_account_info(),
            authority: user_profile.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, mint_to_accounts, signer_seeds);
        token::mint_to(cpi_ctx, 1)?;

        // 2. Revoke Mint Authority to lock the supply to 1
        let set_mint_auth_accounts = SetAuthority {
            account_or_mint: ctx.accounts.nft_mint.to_account_info(),
            current_authority: user_profile.to_account_info(),
        };
        let set_mint_auth_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            set_mint_auth_accounts,
            signer_seeds,
        );
        token::set_authority(
            set_mint_auth_ctx,
            AuthorityType::MintTokens,
            None,
        )?;

        // 3. Revoke Freeze Authority so the user owns it completely
        let set_freeze_auth_accounts = SetAuthority {
            account_or_mint: ctx.accounts.nft_mint.to_account_info(),
            current_authority: user_profile.to_account_info(),
        };
        let set_freeze_auth_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            set_freeze_auth_accounts,
            signer_seeds,
        );
        token::set_authority(
            set_freeze_auth_ctx,
            AuthorityType::FreezeAccount,
            None,
        )?;

        msg!("User registered. Profile created and NFT minted successfully!");
        Ok(())
    }

    /// Processes and sends a batch of messages from one wallet to others.
    /// Emits onchain events for indexers/clients and updates the user's stats.
    pub fn send_batch_messages(
        ctx: Context<SendBatchMessages>,
        messages: Vec<MessageInput>,
    ) -> Result<()> {
        let user_profile = &mut ctx.accounts.user_profile;
        let current_time = Clock::get()?.unix_timestamp;

        require!(
            !messages.is_empty(),
            OnchainOceanError::EmptyMessageBatch
        );

        for msg in messages.iter() {
            // Validate message fields
            require!(
                msg.content.len() <= 256,
                OnchainOceanError::MessageTooLong
            );
            require!(
                msg.recipient != Pubkey::default(),
                OnchainOceanError::InvalidRecipient
            );

            // Emit the message event on-chain
            emit!(MessageSent {
                sender: user_profile.authority,
                recipient: msg.recipient,
                content: msg.content.clone(),
                timestamp: msg.timestamp,
            });
        }

        // Increment stats
        user_profile.message_count = user_profile
            .message_count
            .checked_add(messages.len() as u64)
            .ok_or(OnchainOceanError::NumericalOverflow)?;
        user_profile.last_message_time = current_time;

        msg!("Sent batch of {} messages successfully.", messages.len());
        Ok(())
    }

    /// Updates dynamic user profile metrics/on-chain stats fetched from off-chain APIs.
    pub fn update_profile_stats(
        ctx: Context<UpdateProfileStats>,
        transaction_count: u32,
        contract_types: u64,
        onchain_data_uri: String,
    ) -> Result<()> {
        let user_profile = &mut ctx.accounts.user_profile;

        require!(
            onchain_data_uri.len() <= MAX_URI_LEN,
            OnchainOceanError::UriTooLong
        );

        user_profile.transaction_count = transaction_count;
        user_profile.contract_types = contract_types;
        user_profile.onchain_data_uri = onchain_data_uri;

        msg!("User profile stats updated successfully.");
        Ok(())
    }
}

// ─── Accounts Contexts ───────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct RegisterUser<'info> {
    #[account(
        init,
        payer = user,
        space = UserProfile::SPACE,
        seeds = [b"user-profile", user.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,

    /// The Mint Account of the NFT. Automatically initialized by Anchor.
    #[account(
        init,
        payer = user,
        mint::decimals = 0,
        mint::authority = user_profile,
        mint::freeze_authority = user_profile,
    )]
    pub nft_mint: Account<'info, Mint>,

    /// The Associated Token Account for the user. Automatically initialized by Anchor.
    #[account(
        init,
        payer = user,
        associated_token::mint = nft_mint,
        associated_token::authority = user,
    )]
    pub nft_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct SendBatchMessages<'info> {
    #[account(
        mut,
        seeds = [b"user-profile", authority.key().as_ref()],
        bump = user_profile.bump,
        has_one = authority @ OnchainOceanError::UnauthorizedAccess,
    )]
    pub user_profile: Account<'info, UserProfile>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateProfileStats<'info> {
    #[account(
        mut,
        seeds = [b"user-profile", authority.key().as_ref()],
        bump = user_profile.bump,
        has_one = authority @ OnchainOceanError::UnauthorizedAccess,
    )]
    pub user_profile: Account<'info, UserProfile>,

    pub authority: Signer<'info>,
}

// ─── State Accounts ──────────────────────────────────────────────────────────

#[account]
pub struct UserProfile {
    /// Owner of this user profile.
    pub authority: Pubkey,
    /// NFT mint address minted for the user upon registration.
    pub nft_mint: Pubkey,
    /// Unix timestamp when the user registered.
    pub registered_at: i64,
    /// Total number of messages sent by this user.
    pub message_count: u64,
    /// Unix timestamp of the last message sent.
    pub last_message_time: i64,
    /// Total transaction count of the user on-chain (dynamic metric).
    pub transaction_count: u32,
    /// Contract types bitmask representing categories of smart contracts used (dynamic metric).
    pub contract_types: u64,
    /// Off-chain API data metadata URI (e.g. profile metadata/details).
    pub onchain_data_uri: String,
    /// PDA bump seed.
    pub bump: u8,
}

impl UserProfile {
    /// Discriminator (8) + Authority (32) + NFT Mint (32) + Registered At (8) 
    /// + Message Count (8) + Last Message Time (8) + Transaction Count (4) 
    /// + Contract Types (8) + URI String (4 + MAX_URI_LEN) + Bump (1)
    pub const SPACE: usize = 8 + 32 + 32 + 8 + 8 + 8 + 4 + 8 + (4 + MAX_URI_LEN) + 1;
}

// ─── Struct Types ────────────────────────────────────────────────────────────

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct MessageInput {
    /// The public key of the recipient wallet.
    pub recipient: Pubkey,
    /// The content of the message.
    pub content: String,
    /// The timestamp when the message was sent (according to client).
    pub timestamp: i64,
}

// ─── Events ──────────────────────────────────────────────────────────────────

#[event]
pub struct MessageSent {
    #[index]
    pub sender: Pubkey,
    #[index]
    pub recipient: Pubkey,
    pub content: String,
    pub timestamp: i64,
}

// ─── Custom Errors ───────────────────────────────────────────────────────────

#[error_code]
pub enum OnchainOceanError {
    #[msg("You are not authorized to modify this account.")]
    UnauthorizedAccess,
    #[msg("The dynamic onchain data URI exceeds the maximum allowed length (64).")]
    UriTooLong,
    #[msg("Message batch cannot be empty.")]
    EmptyMessageBatch,
    #[msg("A message in the batch exceeds the maximum allowed length of 256 characters.")]
    MessageTooLong,
    #[msg("The recipient of a message is invalid.")]
    InvalidRecipient,
    #[msg("A numerical overflow occurred during statistical calculation.")]
    NumericalOverflow,
}
