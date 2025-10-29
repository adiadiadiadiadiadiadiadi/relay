# Firebase Auth Migration Guide

## Overview
This project has been migrated from custom JWT authentication to Firebase Authentication. Here's what changed and what you need to do.

## What Changed

### Backend Changes
1. **New Dependencies**: Added `firebase-admin` for server-side token verification
2. **New Middleware**: Created `src/server/middleware/firebaseAuth.js` for token verification
3. **New Endpoints**: 
   - `POST /api/auth/firebase-signup` - Create user in database after Firebase signup
   - `GET /api/auth/user` - Get current user info using Firebase token
4. **Database Schema**: Users table now has a `firebase_uid` column

### Frontend Changes
1. **AuthContext**: Now uses Firebase Auth (createUserWithEmailAndPassword, signInWithEmailAndPassword, etc.)
2. **Token Management**: No more custom JWT - Firebase handles all auth tokens
3. **User Data**: Now has two user objects:
   - `currentUser` - Firebase User object (for authentication state)
   - `userData` - Database user object (for user ID and other app data)

## Setup Instructions

### 1. Database Migration
Run the migration to add the `firebase_uid` column:

```sql
-- In your MySQL database
ALTER TABLE users ADD COLUMN firebase_uid VARCHAR(255) UNIQUE;
ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL;
```

### 2. Firebase Admin Setup

#### Option A: Using Service Account (Recommended for Production)
1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate New Private Key"
3. Download the JSON file
4. Copy the contents and set as environment variable:
```bash
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"...", ...}'
```

#### Option B: Using Environment Variables
You can set up Firebase Admin with individual environment variables if needed.

### 3. Update Client Code
All pages that used `currentUser.id` now need to use `userData.id`:

**Before:**
```typescript
const { currentUser } = useAuth();
const userId = currentUser.id;
```

**After:**
```typescript
const { currentUser, userData } = useAuth();
const userId = userData?.id;
```

Files that need updating (see checklist below):
- JobDetails.tsx
- EmployerDashboard.tsx
- Messages.tsx
- AllPostings.tsx
- Home.tsx
- PostJob.tsx
- AddWallet.tsx
- Header.tsx
- ConfirmationAlert.tsx
- Services.tsx

### 4. Protected Routes
The ProtectedRoute component now checks Firebase auth state:

```typescript
const { currentUser } = useAuth();
if (currentUser) {
  return <>{children}</>;
}
```

## Testing

1. Start the server: `cd src/server && npm start`
2. Start the client: `cd src/client && npm start`
3. Try to sign up with Firebase
4. Check that user is created in database with firebase_uid
5. Verify login works

## Backward Compatibility

The old JWT endpoints (`/api/auth/signup`, `/api/auth/login`) are still available but deprecated. They will be removed in a future version.

## Troubleshooting

### "Firebase Admin not initialized" Warning
- Set the `FIREBASE_SERVICE_ACCOUNT` environment variable
- Or provide a service account JSON file

### "User not found" after login
- The user exists in Firebase but not in your database
- They need to complete the signup process again

### Token verification fails
- Check that Firebase Admin is properly configured
- Verify the service account has the correct permissions
- Ensure environment variables are set correctly

## Next Steps

1. Complete database migration
2. Set up Firebase Admin credentials
3. Update all client files to use `userData` instead of `currentUser` for IDs
4. Test the authentication flow
5. Remove old JWT/bcrypt code when ready

