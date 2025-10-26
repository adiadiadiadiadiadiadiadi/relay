#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Vec};

#[cfg(test)]
mod test;

#[contract]
pub struct ReviewContract;

// Single review record
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Review {
    pub id: u64,
    pub job_id: String,          // References job in MySQL
    pub reviewer: Address,       // Who left the review (employer or employee)
    pub reviewee: Address,       // Who is being reviewed
    pub rating: u32,             // 1-5 stars
    pub comment: String,         // Review text
    pub timestamp: u64,
}

// Storage keys
#[contracttype]
pub enum DataKey {
    ReviewCounter,                           // Global review counter
    Review(u64),                            // Individual review by ID
    UserReviews(Address),                   // List of review IDs for a user
    JobReview(String, Address),             // Track if (job_id, reviewer) already reviewed
}

#[contractimpl]
impl ReviewContract {
    
    /// Leave a review for a user after completing a job
    /// Prevents: double-reviewing same job, invalid ratings
    pub fn leave_review(
        env: Env,
        job_id: String,
        reviewer: Address,
        reviewee: Address,
        rating: u32,
        comment: String,
    ) -> u64 {
        // Verify reviewer signed transaction
        reviewer.require_auth();
        
        // Validate rating (1-5 stars)
        assert!(rating >= 1 && rating <= 5, "Rating must be between 1 and 5");
        
        // Prevent reviewing yourself
        assert!(reviewer != reviewee, "Cannot review yourself");
        
        // Check if already reviewed this job
        let review_key = DataKey::JobReview(job_id.clone(), reviewer.clone());
        let already_reviewed: bool = env
            .storage()
            .instance()
            .get(&review_key)
            .unwrap_or(false);
        
        assert!(!already_reviewed, "Already reviewed this job");
        
        // Generate unique review ID
        let review_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::ReviewCounter)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::ReviewCounter, &(review_id + 1));
        
        // Create review record
        let review = Review {
            id: review_id,
            job_id: job_id.clone(),
            reviewer: reviewer.clone(),
            reviewee: reviewee.clone(),
            rating,
            comment,
            timestamp: env.ledger().timestamp(),
        };
        
        // Store review
        env.storage().instance().set(&DataKey::Review(review_id), &review);
        
        // Add to reviewee's review list
        let mut user_reviews: Vec<u64> = env
            .storage()
            .instance()
            .get(&DataKey::UserReviews(reviewee.clone()))
            .unwrap_or(Vec::new(&env));
        user_reviews.push_back(review_id);
        env.storage().instance().set(&DataKey::UserReviews(reviewee.clone()), &user_reviews);
        
        // Mark this job as reviewed by this reviewer (prevent double-review)
        env.storage().instance().set(&review_key, &true);
        
        review_id
    }
    
    /// Get a single review by ID
    pub fn get_review(env: Env, review_id: u64) -> Review {
        env.storage()
            .instance()
            .get(&DataKey::Review(review_id))
            .expect("Review not found")
    }
    
    /// Get all reviews for a specific user
    pub fn get_user_reviews(env: Env, user: Address) -> Vec<Review> {
        let review_ids: Vec<u64> = env
            .storage()
            .instance()
            .get(&DataKey::UserReviews(user))
            .unwrap_or(Vec::new(&env));
        
        let mut reviews = Vec::new(&env);
        for id in review_ids.iter() {
            if let Some(review) = env.storage().instance().get::<_, Review>(&DataKey::Review(id)) {
                reviews.push_back(review);
            }
        }
        reviews
    }
    
    /// Get average rating for a user (0 if no reviews)
    pub fn get_average_rating(env: Env, user: Address) -> u32 {
        let reviews = Self::get_user_reviews(env.clone(), user);
        
        if reviews.is_empty() {
            return 0;
        }
        
        let mut total: u32 = 0;
        let count = reviews.len();
        
        for review in reviews.iter() {
            total += review.rating;
        }
        
        // Return average rating
        total / count
    }
    
    /// Get total number of reviews for a user
    pub fn get_review_count(env: Env, user: Address) -> u32 {
        let reviews = Self::get_user_reviews(env, user);
        reviews.len()
    }
    
    /// Get rating breakdown (how many 1-star, 2-star, etc.)
    pub fn get_rating_breakdown(env: Env, user: Address) -> Vec<u32> {
        let reviews = Self::get_user_reviews(env.clone(), user);
        
        // Initialize counts [1-star, 2-star, 3-star, 4-star, 5-star]
        let mut breakdown = Vec::new(&env);
        for _ in 0..5 {
            breakdown.push_back(0);
        }
        
        // Count each rating
        for review in reviews.iter() {
            let index = (review.rating - 1) as u32; // Convert 1-5 to 0-4
            if let Some(current) = breakdown.get(index) {
                breakdown.set(index, current + 1);
            }
        }
        
        breakdown
    }
    
    /// Check if a reviewer already reviewed a specific job
    pub fn has_reviewed_job(env: Env, job_id: String, reviewer: Address) -> bool {
        let review_key = DataKey::JobReview(job_id, reviewer);
        env.storage()
            .instance()
            .get(&review_key)
            .unwrap_or(false)
    }
}