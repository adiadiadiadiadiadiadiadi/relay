#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, String, Vec};

#[contract]
pub struct TippingContract;

// Single tip record
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Tip {
    pub id: u64,
    pub job_id: String,          // References job in MySQL (optional, can be empty)
    pub from: Address,           // Tipper (employer)
    pub to: Address,             // Recipient (employee)
    pub amount: i128,            // Amount in stroops
    pub message: String,         // Optional tip message
    pub timestamp: u64,
}

// Storage keys
#[contracttype]
pub enum DataKey {
    TipCounter,                  // Global tip counter
    Tip(u64),                   // Individual tip by ID
    UserTipsReceived(Address),  // List of tip IDs received by user
    UserTipsSent(Address),      // List of tip IDs sent by user
}

#[contractimpl]
impl TippingContract {
    
    /// Send a tip to another user
    /// Can be associated with a job or standalone
    pub fn send_tip(
        env: Env,
        job_id: String,          // Can be empty string for standalone tips
        from: Address,
        to: Address,
        token: Address,          // USDC token contract address
        amount: i128,
        message: String,
    ) -> u64 {
        // Verify sender signed transaction
        from.require_auth();
        
        // Validate amount is positive
        assert!(amount > 0, "Tip amount must be positive");
        
        // Prevent tipping yourself
        assert!(from != to, "Cannot tip yourself");
        
        // Generate unique tip ID
        let tip_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::TipCounter)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::TipCounter, &(tip_id + 1));
        
        // Transfer tokens from sender to recipient
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&from, &to, &amount);
        
        // Create tip record
        let tip = Tip {
            id: tip_id,
            job_id,
            from: from.clone(),
            to: to.clone(),
            amount,
            message,
            timestamp: env.ledger().timestamp(),
        };
        
        // Store tip
        env.storage().instance().set(&DataKey::Tip(tip_id), &tip);
        
        // Add to recipient's received tips list
        let mut received_tips: Vec<u64> = env
            .storage()
            .instance()
            .get(&DataKey::UserTipsReceived(to.clone()))
            .unwrap_or(Vec::new(&env));
        received_tips.push_back(tip_id);
        env.storage().instance().set(&DataKey::UserTipsReceived(to), &received_tips);
        
        // Add to sender's sent tips list
        let mut sent_tips: Vec<u64> = env
            .storage()
            .instance()
            .get(&DataKey::UserTipsSent(from.clone()))
            .unwrap_or(Vec::new(&env));
        sent_tips.push_back(tip_id);
        env.storage().instance().set(&DataKey::UserTipsSent(from), &sent_tips);
        
        tip_id
    }
    
    /// Get a single tip by ID
    pub fn get_tip(env: Env, tip_id: u64) -> Tip {
        env.storage()
            .instance()
            .get(&DataKey::Tip(tip_id))
            .expect("Tip not found")
    }
    
    /// Get all tips received by a user
    pub fn get_tips_received(env: Env, user: Address) -> Vec<Tip> {
        let tip_ids: Vec<u64> = env
            .storage()
            .instance()
            .get(&DataKey::UserTipsReceived(user))
            .unwrap_or(Vec::new(&env));
        
        let mut tips = Vec::new(&env);
        for id in tip_ids.iter() {
            if let Some(tip) = env.storage().instance().get::<_, Tip>(&DataKey::Tip(id)) {
                tips.push_back(tip);
            }
        }
        tips
    }
    
    /// Get all tips sent by a user
    pub fn get_tips_sent(env: Env, user: Address) -> Vec<Tip> {
        let tip_ids: Vec<u64> = env
            .storage()
            .instance()
            .get(&DataKey::UserTipsSent(user))
            .unwrap_or(Vec::new(&env));
        
        let mut tips = Vec::new(&env);
        for id in tip_ids.iter() {
            if let Some(tip) = env.storage().instance().get::<_, Tip>(&DataKey::Tip(id)) {
                tips.push_back(tip);
            }
        }
        tips
    }
    
    /// Get total amount of tips received by a user
    pub fn get_total_tips_received(env: Env, user: Address) -> i128 {
        let tips = Self::get_tips_received(env, user);
        let mut total: i128 = 0;
        
        for tip in tips.iter() {
            total += tip.amount;
        }
        total
    }
    
    /// Get total amount of tips sent by a user
    pub fn get_total_tips_sent(env: Env, user: Address) -> i128 {
        let tips = Self::get_tips_sent(env, user);
        let mut total: i128 = 0;
        
        for tip in tips.iter() {
            total += tip.amount;
        }
        total
    }
    
    /// Get count of tips received
    pub fn get_tips_received_count(env: Env, user: Address) -> u32 {
        let tips = Self::get_tips_received(env, user);
        tips.len()
    }
    
    /// Get count of tips sent
    pub fn get_tips_sent_count(env: Env, user: Address) -> u32 {
        let tips = Self::get_tips_sent(env, user);
        tips.len()
    }
}