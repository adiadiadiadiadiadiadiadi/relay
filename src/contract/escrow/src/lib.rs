#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, String, Env, Vec};

#[contract]
pub struct EscrowContract;

// Escrow record
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Escrow {
    pub id: String,                    // Unique escrow ID
    pub job_id: String,                 // References job in database
    pub employer: Address,             // Who is paying (employer)
    pub employee: Address,             // Who will receive payment
    pub amount: i128,                  // Amount in stroops
    pub token: Address,                // Token contract (USDC or XLM)
    pub status: EscrowStatus,          // Current status
    pub created_at: u64,               // Creation timestamp
    pub deadline: Option<u64>,         // Optional deadline
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum EscrowStatus {
    Locked,      // Funds are locked in escrow
    Approved,    // Employer approved, payment released
    Cancelled,   // Employer cancelled, funds returned
}

// Storage keys
#[contracttype]
pub enum DataKey {
    Escrow(String),                    // Individual escrow by ID
    EmployerEscrows(Address),          // List of escrow IDs by employer
    EmployeeEscrows(Address),          // List of escrow IDs by employee
}

#[contractimpl]
impl EscrowContract {
    
    /// Create a new escrow and lock funds
    /// The employer's funds are transferred into this contract's custody
    pub fn create_escrow(
        env: Env,
        escrow_id: String,
        job_id: String,
        employer: Address,
        employee: Address,
        token: Address,
        amount: i128,
        deadline: Option<u64>,
    ) -> Escrow {
        // Verify caller is the employer
        employer.require_auth();
        
        // Validate amount is positive
        assert!(amount > 0, "Amount must be positive");
        
        // Don't allow self-escrow
        assert!(employer != employee, "Cannot escrow to yourself");
        
        // Check if escrow already exists
        let existing_escrow: Option<Escrow> = env
            .storage()
            .instance()
            .get(&DataKey::Escrow(escrow_id.clone()));
        
        assert!(existing_escrow.is_none(), "Escrow already exists");
        
        // Transfer tokens from employer to this contract (lock them)
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&employer, &env.current_contract_address(), &amount);
        
        // Create escrow record
        let escrow = Escrow {
            id: escrow_id.clone(),
            job_id,
            employer: employer.clone(),
            employee: employee.clone(),
            amount,
            token,
            status: EscrowStatus::Locked,
            created_at: env.ledger().timestamp(),
            deadline,
        };
        
        // Store escrow
        env.storage()
            .instance()
            .set(&DataKey::Escrow(escrow_id.clone()), &escrow);
        
        // Add to employer's list
        let mut employer_escrows: Vec<String> = env
            .storage()
            .instance()
            .get(&DataKey::EmployerEscrows(employer.clone()))
            .unwrap_or(Vec::new(&env));
        employer_escrows.push_back(escrow_id.clone());
        env.storage()
            .instance()
            .set(&DataKey::EmployerEscrows(employer), &employer_escrows);
        
        // Add to employee's list
        let mut employee_escrows: Vec<String> = env
            .storage()
            .instance()
            .get(&DataKey::EmployeeEscrows(employee.clone()))
            .unwrap_or(Vec::new(&env));
        employee_escrows.push_back(escrow_id.clone());
        env.storage()
            .instance()
            .set(&DataKey::EmployeeEscrows(employee), &employee_escrows);
        
        escrow
    }
    
    /// Approve and release funds to employee
    /// Employer must call this to release locked funds
    pub fn approve_escrow(
        env: Env,
        escrow_id: String,
        employer: Address,
    ) {
        // Verify caller is the employer
        employer.require_auth();
        
        // Get escrow
        let mut escrow: Escrow = env
            .storage()
            .instance()
            .get(&DataKey::Escrow(escrow_id.clone()))
            .expect("Escrow not found");
        
        // Verify it's the correct employer
        assert!(escrow.employer == employer, "Unauthorized");
        
        // Check escrow is locked
        assert!(escrow.status == EscrowStatus::Locked, "Escrow must be locked");
        
        // Check deadline if applicable
        if let Some(deadline) = escrow.deadline {
            assert!(env.ledger().timestamp() < deadline, "Escrow expired");
        }
        
        // Transfer locked tokens from contract to employee
        let token_client = token::Client::new(&env, &escrow.token);
        token_client.transfer(&env.current_contract_address(), &escrow.employee, &escrow.amount);
        
        // Update escrow status
        escrow.status = EscrowStatus::Approved;
        env.storage()
            .instance()
            .set(&DataKey::Escrow(escrow_id), &escrow);
    }
    
    /// Cancel escrow and return funds to employer
    /// Only the employer can cancel their escrow
    pub fn cancel_escrow(
        env: Env,
        escrow_id: String,
        employer: Address,
    ) {
        // Verify caller is the employer
        employer.require_auth();
        
        // Get escrow
        let mut escrow: Escrow = env
            .storage()
            .instance()
            .get(&DataKey::Escrow(escrow_id.clone()))
            .expect("Escrow not found");
        
        // Verify it's the correct employer
        assert!(escrow.employer == employer, "Unauthorized");
        
        // Only allow cancelling if still locked
        assert!(escrow.status == EscrowStatus::Locked, "Cannot cancel, escrow already processed");
        
        // Transfer tokens back to employer
        let token_client = token::Client::new(&env, &escrow.token);
        token_client.transfer(&env.current_contract_address(), &escrow.employer, &escrow.amount);
        
        // Update escrow status
        escrow.status = EscrowStatus::Cancelled;
        env.storage()
            .instance()
            .set(&DataKey::Escrow(escrow_id), &escrow);
    }
    
    /// Get escrow details
    pub fn get_escrow(env: Env, escrow_id: String) -> Escrow {
        env.storage()
            .instance()
            .get(&DataKey::Escrow(escrow_id))
            .expect("Escrow not found")
    }
    
    /// Get all escrows for an employer
    pub fn get_employer_escrows(env: Env, employer: Address) -> Vec<String> {
        env.storage()
            .instance()
            .get(&DataKey::EmployerEscrows(employer))
            .unwrap_or(Vec::new(&env))
    }
    
    /// Get all escrows for an employee
    pub fn get_employee_escrows(env: Env, employee: Address) -> Vec<String> {
        env.storage()
            .instance()
            .get(&DataKey::EmployeeEscrows(employee))
            .unwrap_or(Vec::new(&env))
    }
    
    /// Check if escrow is locked
    pub fn is_locked(env: Env, escrow_id: String) -> bool {
        let escrow: Escrow = env
            .storage()
            .instance()
            .get(&DataKey::Escrow(escrow_id))
            .expect("Escrow not found");
        
        escrow.status == EscrowStatus::Locked
    }
}

#[cfg(test)]
mod test;

