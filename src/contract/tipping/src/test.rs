#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

#[test]
fn test_lock_and_release_funds() {
    let env = Env::default();
    env.mock_all_auths(); // Mock wallet signatures for testing
    
    // Register contract
    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);
    
    // Create test addresses
    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);
    let token_addr = Address::generate(&env);
    
    // Test data
    let job_id: u64 = 1;
    let amount: i128 = 1000000000; // 100 USDC in stroops
    
    // Lock funds
    client.lock_funds(&job_id, &client_addr, &freelancer_addr, &token_addr, &amount);
    
    // Check escrow was created
    let escrow = client.get_escrow(&job_id);
    assert_eq!(escrow.job_id, job_id);
    assert_eq!(escrow.client, client_addr);
    assert_eq!(escrow.freelancer, freelancer_addr);
    assert_eq!(escrow.amount, amount);
    assert_eq!(escrow.locked, true);
    
    // Release funds
    client.release_funds(&job_id, &token_addr);
    
    // Check escrow was unlocked
    let escrow_after = client.get_escrow(&job_id);
    assert_eq!(escrow_after.locked, false);
}

#[test]
#[should_panic(expected = "Escrow not found")]
fn test_get_nonexistent_escrow() {
    let env = Env::default();
    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);
    
    // Should panic
    client.get_escrow(&999);
}