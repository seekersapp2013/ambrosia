// Simple URL router for handling article URLs
export interface ArticleRoute {
    type: 'article';
    authorUsername: string;
    slug: string;
}

export interface HomeRoute {
    type: 'home';
}

export type Route = ArticleRoute | HomeRoute;

export function parseCurrentRoute(): Route {
    const path = window.location.pathname;
    
    // Remove leading slash
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    // If empty path, it's home
    if (!cleanPath) {
        return { type: 'home' };
    }
    
    // Split path into segments
    const segments = cleanPath.split('/').filter(Boolean);
    
    // Check if it matches author/slug pattern
    if (segments.length === 2) {
        const [authorUsername, slug] = segments;
        return {
            type: 'article',
            authorUsername,
            slug
        };
    }
    
    // Default to home for unrecognized patterns
    return { type: 'home' };
}

export function navigateToArticle(authorUsername: string, slug: string) {
    const url = `/${authorUsername}/${slug}`;
    window.history.pushState({}, '', url);
    // Trigger a custom event to notify the app of route change
    window.dispatchEvent(new CustomEvent('routechange'));
}

export function navigateToHome() {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new CustomEvent('routechange'));
}

export function generateArticleUrl(authorUsername: string, slug: string): string {
    return `/${authorUsername}/${slug}`;
}

export function getFullArticleUrl(authorUsername: string, slug: string): string {
    return `${window.location.origin}${generateArticleUrl(authorUsername, slug)}`;
}