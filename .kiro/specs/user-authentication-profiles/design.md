# Design Document

## Overview

The User Authentication & Profile Management system is built on Convex Auth for secure authentication and uses a comprehensive profile system that integrates with the platform's social features. The system handles user registration, profile creation, avatar management, and provides the foundation for all user-related functionality across the platform.

## Architecture

### Authentication Layer
- **Convex Auth Integration**: Leverages @convex-dev/auth for secure email-based authentication
- **Session Management**: Automatic session handling with React hooks for authentication state
- **Security**: Built-in protection against common authentication vulnerabilities

### Profile Data Layer
- **User Table**: Core user information managed by Convex Auth
- **Profiles Table**: Extended user information including username, bio, avatar, and wallet data
- **File Storage**: Secure avatar image storage using Convex file storage system

### Frontend Components
- **AuthForm**: Handles user registration and login flows
- **ProfileScreen**: Displays user profiles with statistics and content
- **Profile Management**: Forms for updating profile information

## Components and Interfaces

### Database Schema

#### Users Table (Convex Auth)
```typescript
// Managed by @convex-dev/auth
users: {
  _id: Id<"users">,
  name?: string,
  email: string,
  // ... other auth fields
}
```

#### Profiles Table
```typescript
profiles: {
  _id: Id<"profiles">,
  userId: Id<"users">,
  username: string,           // Unique identifier
  name?: string,             // Display name
  bio?: string,              // User description
  avatar?: string,           // Storage ID for avatar image
  phoneNumber?: string,      // Contact information
  walletAddress?: string,    // Crypto wallet address
  privateKey?: string,       // Encrypted wallet private key
  seedPhrase?: string,       // Encrypted recovery phrase
  createdAt: number,
  updatedAt?: number
}
```

### API Functions

#### Authentication Queries
- `getAuthUserId()`: Get current authenticated user ID
- Authentication state managed by Convex Auth hooks

#### Profile Mutations
- `createOrUpdateProfile()`: Create or update user profile information
- `checkUsernameAvailability()`: Validate username uniqueness

#### Profile Queries
- `getMyProfile()`: Get current user's profile with statistics
- `getProfileByUsername()`: Get profile by username for public viewing
- `searchProfiles()`: Search users by username

### Frontend Integration

#### Authentication Flow
1. User visits platform → AuthForm component displays
2. User enters email → Convex Auth handles registration/login
3. Successful auth → Redirect to main app
4. First-time users → Profile creation prompt

#### Profile Management Flow
1. User accesses profile → ProfileScreen component
2. Edit profile → Profile update forms
3. Avatar upload → File storage integration
4. Statistics display → Real-time data from engagement system

## Data Models

### Profile Statistics Model
```typescript
interface ProfileStats {
  articles: number;      // Published articles count
  reels: number;        // Published reels count
  followers: number;    // Follower count
  following: number;    // Following count
}
```

### Profile Display Model
```typescript
interface ProfileDisplay {
  userId: Id<"users">;
  username: string;
  name?: string;
  bio?: string;
  avatar?: string;
  stats: ProfileStats;
  walletAddress?: string;  // Public wallet for payments
}
```

## Error Handling

### Authentication Errors
- Invalid credentials → Display user-friendly error messages
- Network issues → Retry mechanisms with loading states
- Session expiry → Automatic redirect to login

### Profile Validation Errors
- Username taken → Suggest alternatives with counter suffix
- Invalid data → Field-specific validation messages
- File upload failures → Retry options and error recovery

### Data Consistency
- Profile creation failures → Cleanup partial data
- Username conflicts → Atomic operations to prevent duplicates
- Avatar upload issues → Fallback to default avatars

## Testing Strategy

### Unit Tests
- Profile validation functions
- Username availability checking
- Statistics calculation accuracy
- Data transformation utilities

### Integration Tests
- Authentication flow end-to-end
- Profile creation and updates
- Avatar upload and retrieval
- Search functionality

### User Acceptance Tests
- New user registration journey
- Profile customization workflow
- Public profile viewing
- Search and discovery features

### Performance Tests
- Profile loading times
- Search response times
- Avatar image loading
- Statistics calculation efficiency