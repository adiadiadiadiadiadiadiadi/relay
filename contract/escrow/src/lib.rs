#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env};

#[cfg(test)]
mod test; 

#[contract]
pub struct EscrowContract;

// Escrow data for a single job
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Escrow {
    pub job_id: u64,              // References job in MySQL database
    pub client: Address,          // Client's wallet address
    pub freelancer: Address,      // Freelancer's wallet address
    pub amount: i128,             // Amount in stroops (10^7 = 1 USDC)
    pub locked: bool,             // true = funds locked, false = released/withdrawn
}

// Storage key enum
#[contracttype]
pub enum DataKey {
    Escrow(u64),  // Key by job_id
}

#[contractimpl]
impl EscrowContract {
    
    /// Client locks USDC funds for a specific job
    /// Called after job is created in database
    pub fn lock_funds(
        env: Env,
        job_id: u64,              // ID from MySQL jobs table
        client: Address,          // Client wallet
        freelancer: Address,      // Freelancer wallet
        token: Address,           // USDC token contract address
        amount: i128,             // Amount to lock (in stroops)
    ) {
        // Verify client signed this transaction
        client.require_auth();

        // Transfer USDC from client to contract
        let contract_address = env.current_contract_address();
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&client, &contract_address, &amount);

        // Create and store escrow record
        let escrow = Escrow {
            job_id,
            client,
            freelancer,
            amount,
            locked: true,  // Funds are now locked
        };

        env.storage().instance().set(&DataKey::Escrow(job_id), &escrow);
    }

    /// Release funds to freelancer after client approves work
    /// Client must sign this transaction to authorize release
    pub fn release_funds(
        env: Env,
        job_id: u64,              // Which job to release payment for
        token: Address,           // USDC token contract address
    ) {
        // Load escrow record
        let mut escrow: Escrow = env
            .storage()
            .instance()
            .get(&DataKey::Escrow(job_id))
            .expect("Escrow not found");

        // Verify client is authorizing this release
        escrow.client.require_auth();

        // Check funds haven't already been released
        assert!(escrow.locked, "Funds already released");

        // Transfer USDC from contract to freelancer
        let contract_address = env.current_contract_address();
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&contract_address, &escrow.freelancer, &escrow.amount);

        // Mark as released
        escrow.locked = false;
        env.storage().instance().set(&DataKey::Escrow(job_id), &escrow);
    }

    /// Get escrow details for a job
    pub fn get_escrow(env: Env, job_id: u64) -> Escrow {
        env.storage()
            .instance()
            .get(&DataKey::Escrow(job_id))
            .expect("Escrow not found")
    }
}