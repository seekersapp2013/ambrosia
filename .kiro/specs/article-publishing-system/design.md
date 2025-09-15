# Design Document

## Overview

The Article Publishing System is a comprehensive content management solution built on Convex that enables rich text article creation, publishing, and monetization. The system integrates with the platform's authentication, file storage, and payment systems to provide a seamless content creation experience.

## Architecture

### Content Management Layer
- **Rich Text Editor**: HTML-based content creation with formatting preservation
- **File Storage Integration**: Secure cover image and media storage using Convex files
- **Content Validation**: Server-side validation for titles, content, and metadata

### Publishing Pipeline
- **Draft Management**: Save and edit articles before publishing
- **Publication Flow**: Convert drafts to published articles with slug generation
- **Content Indexing**: Automatic tagging and search optimization

### Monetization Layer
- **Token Gating**: Integration with crypto payment system for premium content
- **Access Control**: Payment verification and content access management
- **Creator Economics**: Wallet integration for content monetization

## Components and Interfaces

### Database Schema

#### Articles Table
```typescript
articles: {
  _id: Id<"articles">,
  authorId: Id<"users">,
  title: string,
  subtitle?: string,
  slug: string,                    // URL-friendly identifier
  contentHtml: string,             // Rich text content as HTML
  contentDelta?: any,              // Optional editor state
  coverImage?: string,             // Storage ID for cover image
  readTimeMin: number,             // Calculated reading time
  tags: string[],                  // Content categorization
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED",
  publishedAt?: number,
  isSensitive: boolean,            // Content warning flag
  isGated: boolean,                // Monetization flag
  priceToken?: string,             // Payment token (e.g., "USD")
  priceAmount?: number,            // Price for gated content
  sellerAddress?: string,          // Creator's wallet address
  views: number,                   // View count
  createdAt: number,
  updatedAt?: number
}
```### API 
Functions

#### Content Creation
- `createArticle()`: Create new article with validation and slug generation
- `publishArticle()`: Change article status from draft to published
- `setGating()`: Configure monetization settings for articles

#### Content Retrieval
- `getArticleById()`: Get article by ID with author information
- `getArticleBySlug()`: Get article by URL slug for public access
- `listFeed()`: Get published articles for main feed
- `getArticlesByAuthor()`: Get all articles by specific author

#### Content Management
- `incrementViews()`: Track article view counts
- `searchArticles()`: Search articles by title and content

### Frontend Components

#### Content Creation
- **WriteArticle**: Rich text editor with title, subtitle, and cover image upload
- **ArticleEditor**: HTML-based editor with formatting tools
- **TagInput**: Tag selection and creation interface
- **GatingControls**: Monetization settings for premium content

#### Content Display
- **ArticleCard**: Article preview for feeds and lists
- **PrivateArticleViewer**: Full article display for authenticated users
- **PublicArticleViewer**: Public article access with paywall integration
- **StreamScreen**: Main feed displaying article cards

## Data Models

### Article Creation Model
```typescript
interface ArticleCreation {
  title: string;
  subtitle?: string;
  contentHtml: string;
  coverImage?: string;
  tags: string[];
  isSensitive: boolean;
  isGated: boolean;
  priceToken?: string;
  priceAmount?: number;
  sellerAddress?: string;
}
```

### Article Display Model
```typescript
interface ArticleDisplay {
  _id: Id<"articles">;
  title: string;
  subtitle?: string;
  slug: string;
  contentHtml: string;
  coverImage?: string;
  readTimeMin: number;
  tags: string[];
  views: number;
  publishedAt: number;
  author: {
    id: Id<"users">;
    name?: string;
    username?: string;
    avatar?: string;
  };
  isGated: boolean;
  priceAmount?: number;
  priceToken?: string;
}
```

## Error Handling

### Content Validation
- Empty title → Prevent publication with validation message
- Missing content → Require minimum content length
- Invalid HTML → Sanitize and validate content structure
- Large file uploads → Size limits and compression

### Publishing Errors
- Slug conflicts → Generate unique slugs with timestamps
- Network failures → Auto-save drafts and retry mechanisms
- Permission errors → Validate user ownership before operations

### Access Control
- Gated content access → Payment verification before content display
- Author permissions → Ensure only authors can edit their content
- Content visibility → Respect publication status and user permissions

## Testing Strategy

### Unit Tests
- Article creation and validation logic
- Slug generation and uniqueness
- Reading time calculation accuracy
- Content sanitization and security

### Integration Tests
- Complete article publishing workflow
- Gated content access and payment integration
- Search functionality across articles
- Author management and permissions

### User Acceptance Tests
- Article creation and editing experience
- Public article viewing and navigation
- Monetized content purchase flow
- Search and discovery functionality

### Performance Tests
- Article loading times witeedcessing spd and proploa u- Imageonse times
esprch res
- Seaticlth many arding wi Feed loantent
-h large co