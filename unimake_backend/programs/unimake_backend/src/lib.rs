use anchor_lang::prelude::*;

declare_id!("CJpjA6x7h3GZZzDnzFggjrV6JG7UVhsX5kCp7N95UDDG");

#[program]
pub mod unimake_backend {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
