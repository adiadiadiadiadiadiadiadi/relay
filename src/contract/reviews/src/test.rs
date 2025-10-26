#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String, vec};

#[test]
fn test_leave_review() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(ReviewContract, ());
    let client = ReviewContractClient::new(&env, &contract_id);
    
    let reviewer = Address::generate(&env);
    let reviewee = Address::generate(&env);
    
    // Leave a review
    let review_id = client.leave_review(
        &String::from_str(&env, "job-123"),
        &reviewer,
        &reviewee,
        &4,
        &String::from_str(&env, "Good work!")
    );
    
    assert_eq!(review_id, 0);
    
    // Get reviews
    let reviews = client.get_user_reviews(&reviewee);
    assert_eq!(reviews.len(), 1);
    
    // Get average rating
    let avg = client.get_average_rating(&reviewee);
    assert_eq!(avg, 4);
}

#[test]
fn test_get_review() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(ReviewContract, ());
    let client = ReviewContractClient::new(&env, &contract_id);
    
    let reviewer = Address::generate(&env);
    let reviewee = Address::generate(&env);
    
    let review_id = client.leave_review(
        &String::from_str(&env, "job-456"),
        &reviewer,
        &reviewee,
        &5,
        &String::from_str(&env, "Excellent!")
    );
    
    let review = client.get_review(&review_id);
    
    assert_eq!(review.id, 0);
    assert_eq!(review.job_id, String::from_str(&env, "job-456"));
    assert_eq!(review.reviewer, reviewer);
    assert_eq!(review.reviewee, reviewee);
    assert_eq!(review.rating, 5);
    assert_eq!(review.comment, String::from_str(&env, "Excellent!"));
}

#[test]
fn test_multiple_reviews() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(ReviewContract, ());
    let client = ReviewContractClient::new(&env, &contract_id);
    
    let reviewer1 = Address::generate(&env);
    let reviewer2 = Address::generate(&env);
    let reviewee = Address::generate(&env);
    
    // Leave two reviews
    client.leave_review(
        &String::from_str(&env, "job-1"),
        &reviewer1,
        &reviewee,
        &5,
        &String::from_str(&env, "Great!")
    );
    
    client.leave_review(
        &String::from_str(&env, "job-2"),
        &reviewer2,
        &reviewee,
        &3,
        &String::from_str(&env, "Good")
    );
    
    let reviews = client.get_user_reviews(&reviewee);
    assert_eq!(reviews.len(), 2);
    
    // Average of 5 and 3 = 4
    let avg = client.get_average_rating(&reviewee);
    assert_eq!(avg, 4);
}

#[test]
fn test_review_count() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(ReviewContract, ());
    let client = ReviewContractClient::new(&env, &contract_id);
    
    let reviewee = Address::generate(&env);
    
    // Initially zero
    assert_eq!(client.get_review_count(&reviewee), 0);
    
    // Leave 3 reviews
    for _ in 0..3 {
        let reviewer = Address::generate(&env);
        client.leave_review(
            &String::from_str(&env, "job-test"),
            &reviewer,
            &reviewee,
            &5,
            &String::from_str(&env, "Good")
        );
    }
    
    assert_eq!(client.get_review_count(&reviewee), 3);
}

#[test]
fn test_average_rating_no_reviews() {
    let env = Env::default();
    
    let contract_id = env.register(ReviewContract, ());
    let client = ReviewContractClient::new(&env, &contract_id);
    
    let reviewee = Address::generate(&env);
    
    // Should return 0 for no reviews
    let avg = client.get_average_rating(&reviewee);
    assert_eq!(avg, 0);
}

#[test]
fn test_rating_breakdown() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(ReviewContract, ());
    let client = ReviewContractClient::new(&env, &contract_id);
    
    let reviewee = Address::generate(&env);
    
    // Leave reviews with different ratings
    let ratings = vec![&env, 5, 4, 5, 3, 5];
    for rating in ratings.iter() {
        let reviewer = Address::generate(&env);
        client.leave_review(
            &String::from_str(&env, "job-x"),
            &reviewer,
            &reviewee,
            &rating,
            &String::from_str(&env, "Review")
        );
    }
    
    let breakdown = client.get_rating_breakdown(&reviewee);
    
    // [1-star, 2-star, 3-star, 4-star, 5-star]
    assert_eq!(breakdown.get(0).unwrap(), 0); // No 1-star
    assert_eq!(breakdown.get(1).unwrap(), 0); // No 2-star
    assert_eq!(breakdown.get(2).unwrap(), 1); // One 3-star
    assert_eq!(breakdown.get(3).unwrap(), 1); // One 4-star
    assert_eq!(breakdown.get(4).unwrap(), 3); // Three 5-star
}

#[test]
#[should_panic(expected = "Already reviewed this job")]
fn test_prevent_double_review() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(ReviewContract, ());
    let client = ReviewContractClient::new(&env, &contract_id);
    
    let reviewer = Address::generate(&env);
    let reviewee = Address::generate(&env);
    let job_id = String::from_str(&env, "job-123");
    
    // First review - should work
    client.leave_review(&job_id, &reviewer, &reviewee, &5, &String::from_str(&env, "Great!"));
    
    // Second review - should panic
    client.leave_review(&job_id, &reviewer, &reviewee, &4, &String::from_str(&env, "Again"));
}

#[test]
#[should_panic(expected = "Rating must be between 1 and 5")]
fn test_invalid_rating_zero() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(ReviewContract, ());
    let client = ReviewContractClient::new(&env, &contract_id);
    
    let reviewer = Address::generate(&env);
    let reviewee = Address::generate(&env);
    
    // Rating 0 should panic
    client.leave_review(
        &String::from_str(&env, "job-123"),
        &reviewer,
        &reviewee,
        &0,
        &String::from_str(&env, "Bad rating")
    );
}

#[test]
#[should_panic(expected = "Rating must be between 1 and 5")]
fn test_invalid_rating_six() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(ReviewContract, ());
    let client = ReviewContractClient::new(&env, &contract_id);
    
    let reviewer = Address::generate(&env);
    let reviewee = Address::generate(&env);
    
    // Rating 6 should panic
    client.leave_review(
        &String::from_str(&env, "job-123"),
        &reviewer,
        &reviewee,
        &6,
        &String::from_str(&env, "Bad rating")
    );
}

#[test]
#[should_panic(expected = "Cannot review yourself")]
fn test_review_yourself() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(ReviewContract, ());
    let client = ReviewContractClient::new(&env, &contract_id);
    
    let reviewer = Address::generate(&env);
    
    // Reviewing yourself should panic
    client.leave_review(
        &String::from_str(&env, "job-123"),
        &reviewer,
        &reviewer, // Same address
        &5,
        &String::from_str(&env, "Self review")
    );
}

#[test]
fn test_has_reviewed_job() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(ReviewContract, ());
    let client = ReviewContractClient::new(&env, &contract_id);
    
    let reviewer = Address::generate(&env);
    let reviewee = Address::generate(&env);
    let job_id = String::from_str(&env, "job-123");
    
    // Initially false
    assert_eq!(client.has_reviewed_job(&job_id, &reviewer), false);
    
    // Leave review
    client.leave_review(&job_id, &reviewer, &reviewee, &5, &String::from_str(&env, "Good"));
    
    // Now true
    assert_eq!(client.has_reviewed_job(&job_id, &reviewer), true);
    
    // Different job should be false
    assert_eq!(
        client.has_reviewed_job(&String::from_str(&env, "job-456"), &reviewer),
        false
    );
}

#[test]
fn test_review_with_empty_comment() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(ReviewContract, ());
    let client = ReviewContractClient::new(&env, &contract_id);
    
    let reviewer = Address::generate(&env);
    let reviewee = Address::generate(&env);
    
    let review_id = client.leave_review(
        &String::from_str(&env, "job-123"),
        &reviewer,
        &reviewee,
        &4,
        &String::from_str(&env, "") // Empty comment
    );
    
    let review = client.get_review(&review_id);
    assert_eq!(review.comment, String::from_str(&env, ""));
}

#[test]
fn test_all_five_star_ratings() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(ReviewContract, ());
    let client = ReviewContractClient::new(&env, &contract_id);
    
    let reviewee = Address::generate(&env);
    
    // Leave 5 five-star reviews
    for _ in 0..5 {
        let reviewer = Address::generate(&env);
        client.leave_review(
            &String::from_str(&env, "job-x"),
            &reviewer,
            &reviewee,
            &5,
            &String::from_str(&env, "Perfect!")
        );
    }
    
    let avg = client.get_average_rating(&reviewee);
    assert_eq!(avg, 5);
}

#[test]
fn test_review_ids_increment() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(ReviewContract, ());
    let client = ReviewContractClient::new(&env, &contract_id);
    
    let reviewee = Address::generate(&env);
    
    let id1 = client.leave_review(
        &String::from_str(&env, "job-1"),
        &Address::generate(&env),
        &reviewee,
        &5,
        &String::from_str(&env, "Review 1")
    );
    
    let id2 = client.leave_review(
        &String::from_str(&env, "job-2"),
        &Address::generate(&env),
        &reviewee,
        &4,
        &String::from_str(&env, "Review 2")
    );
    
    let id3 = client.leave_review(
        &String::from_str(&env, "job-3"),
        &Address::generate(&env),
        &reviewee,
        &3,
        &String::from_str(&env, "Review 3")
    );
    
    assert_eq!(id1, 0);
    assert_eq!(id2, 1);
    assert_eq!(id3, 2);
}