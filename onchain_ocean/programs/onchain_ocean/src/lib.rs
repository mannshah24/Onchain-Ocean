use anchor_lang::prelude::*;

declare_id!("514tYhSb8oavhp61t58dxRVxYSShn3MJkNP6cR2HD4DP");

// ── Constants ────────────────────────────────────────────────────────────────
/// Max byte length for the `developer_tier` string (e.g. "Shark" = 5 chars).
const MAX_TIER_LEN: usize = 16;
/// Max byte length for the `pfp_face` string (e.g. "Guppy" = 5 chars).
const MAX_FACE_LEN: usize = 16;
/// Max byte length for the `sector` string (e.g. "Infrastructure" = 14 chars).
const MAX_SECTOR_LEN: usize = 32;

// ── Program ──────────────────────────────────────────────────────────────────
#[program]
pub mod onchain_ocean {
    use super::*;

    /// Initializes a new `DeveloperPassport` PDA for the signing wallet.
    pub fn initialize_passport(ctx: Context<InitializePassport>) -> Result<()> {
        let passport = &mut ctx.accounts.passport;
        passport.authority = ctx.accounts.authority.key();
        passport.contracts_deployed = 0;
        passport.volume_moved = 0;
        passport.developer_tier = "Guppy".to_string();
        passport.pfp_face = "Guppy".to_string();
        passport.bump = ctx.bumps.passport;

        msg!(
            "DeveloperPassport initialized for {}",
            passport.authority
        );
        Ok(())
    }

    /// Initializes a new `StartupRig` PDA for the signing wallet.
    pub fn initialize_startup_rig(
        ctx: Context<InitializeStartupRig>,
        sector: String,
    ) -> Result<()> {
        require!(
            sector.len() <= MAX_SECTOR_LEN,
            OnchainOceanError::SectorTooLong
        );

        let rig = &mut ctx.accounts.startup_rig;
        rig.company = ctx.accounts.authority.key();
        rig.sector = sector;
        rig.active_bounty_tvl = 0;
        rig.bump = ctx.bumps.startup_rig;

        msg!("StartupRig initialized for {}", rig.company);
        Ok(())
    }

    /// Updates metrics on an existing `DeveloperPassport` and recalculates
    /// the `developer_tier` and `pfp_face` based on `contracts_deployed`.
    ///
    /// Tier thresholds:
    /// - 0 contracts  → "Guppy"
    /// - > 5 contracts → "Crab"
    /// - > 10 contracts → "Shark"
    pub fn update_passport_metrics(
        ctx: Context<UpdatePassportMetrics>,
        contracts_deployed: u32,
        volume_moved: u64,
    ) -> Result<()> {
        let passport = &mut ctx.accounts.passport;

        // Update raw metrics
        passport.contracts_deployed = contracts_deployed;
        passport.volume_moved = volume_moved;

        // Derive tier & face from contracts_deployed
        let (tier, face) = if contracts_deployed > 10 {
            ("Shark", "Shark")
        } else if contracts_deployed > 5 {
            ("Crab", "Crab")
        } else {
            ("Guppy", "Guppy")
        };

        passport.developer_tier = tier.to_string();
        passport.pfp_face = face.to_string();

        msg!(
            "Passport updated → tier: {}, face: {}, contracts: {}, volume: {}",
            tier,
            face,
            contracts_deployed,
            volume_moved
        );
        Ok(())
    }
}

// ── Accounts Contexts ────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializePassport<'info> {
    #[account(
        init,
        payer = authority,
        space = DeveloperPassport::SPACE,
        seeds = [b"passport", authority.key().as_ref()],
        bump
    )]
    pub passport: Account<'info, DeveloperPassport>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeStartupRig<'info> {
    #[account(
        init,
        payer = authority,
        space = StartupRig::SPACE,
        seeds = [b"startup_rig", authority.key().as_ref()],
        bump
    )]
    pub startup_rig: Account<'info, StartupRig>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdatePassportMetrics<'info> {
    #[account(
        mut,
        seeds = [b"passport", authority.key().as_ref()],
        bump = passport.bump,
        has_one = authority @ OnchainOceanError::UnauthorizedAccess,
    )]
    pub passport: Account<'info, DeveloperPassport>,

    pub authority: Signer<'info>,
}

// ── State Accounts ───────────────────────────────────────────────────────────

#[account]
pub struct DeveloperPassport {
    /// The wallet that owns this passport.
    pub authority: Pubkey,
    /// Total smart contracts deployed by this developer.
    pub contracts_deployed: u32,
    /// Cumulative volume moved (in lamports or token base units).
    pub volume_moved: u64,
    /// Current tier label: "Guppy" | "Crab" | "Shark".
    pub developer_tier: String,
    /// Profile-picture face that corresponds to the tier.
    pub pfp_face: String,
    /// PDA bump seed for re-derivation.
    pub bump: u8,
}

impl DeveloperPassport {
    /// Discriminator (8) + Pubkey (32) + u32 (4) + u64 (8)
    /// + String prefix (4) + MAX_TIER_LEN
    /// + String prefix (4) + MAX_FACE_LEN
    /// + bump (1)
    pub const SPACE: usize = 8 + 32 + 4 + 8 + (4 + MAX_TIER_LEN) + (4 + MAX_FACE_LEN) + 1;
}

#[account]
pub struct StartupRig {
    /// The company wallet that owns this rig.
    pub company: Pubkey,
    /// Business sector: e.g. "DeFi", "Infrastructure", "Gaming".
    pub sector: String,
    /// Total value locked across active bounties (lamports).
    pub active_bounty_tvl: u64,
    /// PDA bump seed for re-derivation.
    pub bump: u8,
}

impl StartupRig {
    /// Discriminator (8) + Pubkey (32)
    /// + String prefix (4) + MAX_SECTOR_LEN
    /// + u64 (8) + bump (1)
    pub const SPACE: usize = 8 + 32 + (4 + MAX_SECTOR_LEN) + 8 + 1;
}

// ── Custom Errors ────────────────────────────────────────────────────────────

#[error_code]
pub enum OnchainOceanError {
    #[msg("The provided sector string exceeds the maximum allowed length.")]
    SectorTooLong,
    #[msg("You are not authorized to modify this account.")]
    UnauthorizedAccess,
}
