#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::Address as _,
    token, Address, Env, String,
};

// Mock token contract for testing
fn create_token_contract<'a>(e: &Env, admin: &Address) -> (Address, token::Client<'a>, token::StellarAssetClient<'a>) {
    let contract_address = e.register_stellar_asset_contract_v2(admin.clone());
    let contract_addr = contract_address.address();
    (
        contract_addr.clone(),
        token::Client::new(e, &contract_addr),
        token::StellarAssetClient::new(e, &contract_addr),
    )
}

#[test]
fn test_send_tip() {
    let env = Env::default();
    env.mock_all_auths();
    
    // Register tipping contract
    let contract_id = env.register(TippingContract, ());
    let client = TippingContractClient::new(&env, &contract_id);
    
    // Create test addresses
    let tipper = Address::generate(&env);
    let recipient = Address::generate(&env);
    let admin = Address::generate(&env);
    
    // Create mock token
    let (token_id, token_client, token_admin) = create_token_contract(&env, &admin);
    
    // Mint tokens to tipper
    token_admin.mint(&tipper, &1000_0000000); // 1000 USDC
    
    // Send tip
    let tip_id = client.send_tip(
        &String::from_str(&env, "job-123"),
        &tipper,
        &recipient,
        &token_id,
        &100_0000000, // 100 USDC
        &String::from_str(&env, "Great work!")
    );
    
    assert_eq!(tip_id, 0);
    
    // Verify recipient received tokens
    let recipient_balance = token_client.balance(&recipient);
    assert_eq!(recipient_balance, 100_0000000);
    
    // Verify tipper balance decreased
    let tipper_balance = token_client.balance(&tipper);
    assert_eq!(tipper_balance, 900_0000000);
}

#[test]
fn test_get_tip() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(TippingContract, ());
    let client = TippingContractClient::new(&env, &contract_id);
    
    let tipper = Address::generate(&env);
    let recipient = Address::generate(&env);
    let admin = Address::generate(&env);
    
    let (token_id, _, token_admin) = create_token_contract(&env, &admin);
    token_admin.mint(&tipper, &1000_0000000);
    
    // Send tip
    let tip_id = client.send_tip(
        &String::from_str(&env, "job-456"),
        &tipper,
        &recipient,
        &token_id,
        &50_0000000,
        &String::from_str(&env, "Thanks!")
    );
    
    // Get tip details
    let tip = client.get_tip(&tip_id);
    
    assert_eq!(tip.id, 0);
    assert_eq!(tip.job_id, String::from_str(&env, "job-456"));
    assert_eq!(tip.from, tipper);
    assert_eq!(tip.to, recipient);
    assert_eq!(tip.amount, 50_0000000);
    assert_eq!(tip.message, String::from_str(&env, "Thanks!"));
}

#[test]
fn test_get_tips_received() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(TippingContract, ());
    let client = TippingContractClient::new(&env, &contract_id);
    
    let tipper1 = Address::generate(&env);
    let tipper2 = Address::generate(&env);
    let recipient = Address::generate(&env);
    let admin = Address::generate(&env);
    
    let (token_id, _, token_admin) = create_token_contract(&env, &admin);
    token_admin.mint(&tipper1, &1000_0000000);
    token_admin.mint(&tipper2, &1000_0000000);
    
    // Send multiple tips to same recipient
    client.send_tip(
        &String::from_str(&env, "job-1"),
        &tipper1,
        &recipient,
        &token_id,
        &100_0000000,
        &String::from_str(&env, "Tip 1")
    );
    
    client.send_tip(
        &String::from_str(&env, "job-2"),
        &tipper2,
        &recipient,
        &token_id,
        &200_0000000,
        &String::from_str(&env, "Tip 2")
    );
    
    // Get all tips received
    let tips = client.get_tips_received(&recipient);
    
    assert_eq!(tips.len(), 2);
    assert_eq!(tips.get(0).unwrap().amount, 100_0000000);
    assert_eq!(tips.get(1).unwrap().amount, 200_0000000);
}

#[test]
fn test_get_total_tips_received() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(TippingContract, ());
    let client = TippingContractClient::new(&env, &contract_id);
    
    let tipper1 = Address::generate(&env);
    let tipper2 = Address::generate(&env);
    let recipient = Address::generate(&env);
    let admin = Address::generate(&env);
    
    let (token_id, _, token_admin) = create_token_contract(&env, &admin);
    token_admin.mint(&tipper1, &1000_0000000);
    token_admin.mint(&tipper2, &1000_0000000);
    
    // Send multiple tips
    client.send_tip(
        &String::from_str(&env, "job-1"),
        &tipper1,
        &recipient,
        &token_id,
        &100_0000000,
        &String::from_str(&env, "Tip 1")
    );
    
    client.send_tip(
        &String::from_str(&env, "job-2"),
        &tipper2,
        &recipient,
        &token_id,
        &250_0000000,
        &String::from_str(&env, "Tip 2")
    );
    
    // Get total
    let total = client.get_total_tips_received(&recipient);
    
    assert_eq!(total, 350_0000000); // 100 + 250
}

#[test]
#[should_panic(expected = "Tip amount must be positive")]
fn test_zero_amount() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(TippingContract, ());
    let client = TippingContractClient::new(&env, &contract_id);
    
    let tipper = Address::generate(&env);
    let recipient = Address::generate(&env);
    let token_id = Address::generate(&env);
    
    // Should panic with zero amount
    client.send_tip(
        &String::from_str(&env, "job-1"),
        &tipper,
        &recipient,
        &token_id,
        &0,
        &String::from_str(&env, "Invalid")
    );
}

#[test]
#[should_panic(expected = "Cannot tip yourself")]
fn test_tip_yourself() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(TippingContract, ());
    let client = TippingContractClient::new(&env, &contract_id);
    
    let tipper = Address::generate(&env);
    let token_id = Address::generate(&env);
    
    // Should panic when tipping yourself
    client.send_tip(
        &String::from_str(&env, "job-1"),
        &tipper,
        &tipper, // Same address
        &token_id,
        &100_0000000,
        &String::from_str(&env, "Invalid")
    );
}

#[test]
fn test_tip_with_empty_job_id() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(TippingContract, ());
    let client = TippingContractClient::new(&env, &contract_id);
    
    let tipper = Address::generate(&env);
    let recipient = Address::generate(&env);
    let admin = Address::generate(&env);
    
    let (token_id, _, token_admin) = create_token_contract(&env, &admin);
    token_admin.mint(&tipper, &1000_0000000);
    
    // Tip with empty job_id (standalone tip)
    let tip_id = client.send_tip(
        &String::from_str(&env, ""), // Empty job_id
        &tipper,
        &recipient,
        &token_id,
        &50_0000000,
        &String::from_str(&env, "Random tip")
    );
    
    let tip = client.get_tip(&tip_id);
    assert_eq!(tip.job_id, String::from_str(&env, ""));
}

#[test]
fn test_multiple_tips_increment_ids() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(TippingContract, ());
    let client = TippingContractClient::new(&env, &contract_id);
    
    let tipper = Address::generate(&env);
    let recipient = Address::generate(&env);
    let admin = Address::generate(&env);
    
    let (token_id, _, token_admin) = create_token_contract(&env, &admin);
    token_admin.mint(&tipper, &1000_0000000);
    
    // Send 3 tips and verify IDs increment
    let id1 = client.send_tip(
        &String::from_str(&env, "job-1"),
        &tipper,
        &recipient,
        &token_id,
        &10_0000000,
        &String::from_str(&env, "Tip 1")
    );
    
    let id2 = client.send_tip(
        &String::from_str(&env, "job-2"),
        &tipper,
        &recipient,
        &token_id,
        &10_0000000,
        &String::from_str(&env, "Tip 2")
    );
    
    let id3 = client.send_tip(
        &String::from_str(&env, "job-3"),
        &tipper,
        &recipient,
        &token_id,
        &10_0000000,
        &String::from_str(&env, "Tip 3")
    );
    
    assert_eq!(id1, 0);
    assert_eq!(id2, 1);
    assert_eq!(id3, 2);
}