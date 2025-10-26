#![cfg(test)]

use super::*;
use soroban_sdk::testutils::{Ledger, LedgerInfo};
use soroban_sdk::{
    testutils::Address as TestAddress, Address, Bytes, String, Vec
};

#[test]
fn test_create_escrow() {
    let env = Env::default();
    
    // Create test addresses
    let employer = TestAddress::generate(&env);
    let employee = TestAddress::generate(&env);
    
    // Create token
    let token = TestAddress::generate(&env);
    
    // Set ledger info
    env.ledger().set(LedgerInfo {
        timestamp: 123456,
        protocol_version: 0,
        sequence_number: 0,
        base_reserve: 100,
        network_passphrase: String::from_str(&env, "Test SDF Network"),
        base_fee: 100,
    });
    
    // Create contract
    let contract_id = env.register_contract(None, EscrowContract);
    let client = EscrowContractClient::new(&env, &contract_id);
    
    // Mock token allowance
    let escrow_id = String::from_str(&env, "test_escrow");
    let job_id = String::from_str(&env, "test_job");
    
    // Note: In real tests, you'd need to mock the token contract
    // and set up proper allowances. This is a simplified version.
    
    // The actual test would require token mocking which is more complex
}

