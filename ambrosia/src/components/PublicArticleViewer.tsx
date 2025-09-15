import { useQuery, useConvexAuth, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getFullArticleUrl } from "../utils/router";
import { ArticleEngagement } from "./ArticleEngagement";
import { GatedContentPaywall } from "./GatedContentPaywall";
import { useEffect } from "react";

interface PublicArticleViewerProps {
    slug: string;
    authorUsername: string;
}

export function PublicArticleViewer({ slug }: PublicArticleViewerProps) {
    const { isAuthenticated } = useConvexAuth();
    const article = useQuery(api.articles.getArticleBySlug, { slug });
    const recordRead = useMutation(api.engagement.recordArticleRead);

    // Check if user has access to gated content
    const hasAccess = useQuery(api.payments.hasAccess,
        article?._id ? {
            contentType: "article",
            contentId: article._id,
        } : undefined as any
    );

    // Get cover image URL
    const coverImageUrl = useQuery(
        api.files.getFileUrl,
        article?.coverImage ? { storageId: article.coverImage } : undefined as any
    );

    // Get author avatar URL
    const authorAvatarUrl = useQuery(
        api.files.getFileUrl,
        article?.author?.avatar ? { storageId: article.author.avatar } : undefined as any
    );

    // Record that the user has read this article (required for clapping)
    useEffect(() => {
        if (article && article._id && isAuthenticated) {
            recordRead({ articleId: article._id });
        }
    }, [article, isAuthenticated, recordRead]);

    const handleShare = () => {
        if (article && article.author?.username) {
            const url = getFullArticleUrl(article.author.username, article.slug);
            if (navigator.share) {
                navigator.share({
                    title: article.title,
                    text: article.subtitle || article.title,
                    url: url
                });
            } else {
                navigator.clipboard.writeText(url).then(() => {
                    alert('Article URL copied to clipboard!');
                }).catch(() => {
                    alert(`Share this article: ${url}`);
                });
            }
        }
    };

    if (article === undefined) {
        return (
            <div className="bg-white min-h-screen">
                <div className="p-4">
                    <p className="text-gray-500">Loading article...</p>
                </div>
            </div>
        );
    }

    if (article === null) {
        return (
            <div className="bg-white min-h-screen">
                <div className="p-4">
                    <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
                    <p className="text-gray-600">
                        The article you're looking for doesn't exist or may have been removed.
                    </p>
                    <a
                        href="/"
                        className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Go to Home
                    </a>
                </div>
            </div>
        );
    }

    // Check if content is gated and user doesn't have access
    if (article?.isGated && hasAccess === false) {
        return (
            <div className="bg-white min-h-screen">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
                    <a href="/" className="text-gray-600 hover:text-gray-800">
                        <i className="fas fa-arrow-left text-xl"></i>
                    </a>
                    <h1 className="text-lg font-semibold">Premium Content</h1>
                    <div className="flex items-center space-x-3">
                        <a
                            href="/"
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                            Sign In
                        </a>
                    </div>
                </div>
                <GatedContentPaywall
                    contentType="article"
                    contentId={article._id}
                    title={article.title}
                    price={article.priceAmount || 0}
                    token={article.priceToken || "USD"}
                    sellerAddress={article.sellerAddress}
                    onUnlock={() => {
                        if (!isAuthenticated) {
                            // Redirect to sign in
                            window.location.href = '/';
                        }
                        // Content will automatically become accessible after payment
                    }}
                    onFundWallet={() => {
                        if (!isAuthenticated) {
                            window.location.href = '/';
                        } else {
                            // For public viewer, we can't navigate to fund wallet easily
                            // So we'll redirect to the main app
                            window.location.href = '/';
                        }
                    }}
                />
            </div>
        );
    }

    // Note: We're not verifying the author name in the URL for simplicity
    // The slug should be unique enough to identify the article

    return (
        <div className="bg-white min-h-screen">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
                <a href="/" className="text-gray-600 hover:text-gray-800">
                    <i className="fas fa-arrow-left text-xl"></i>
                </a>
                <h1 className="text-lg font-semibold">Ambrosia</h1>
                <div className="flex items-center space-x-3">
                    <button onClick={handleShare} className="text-gray-600 hover:text-blue-600">
                        <i className="fas fa-share text-xl"></i>
                    </button>
                    <a
                        href="/"
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                        Sign In
                    </a>
                </div>
            </div>

            {/* Article Content */}
            <div className="max-w-4xl mx-auto p-4">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-3">{article.title}</h1>
                    {article.subtitle && (
                        <p className="text-xl text-gray-600 mb-4">{article.subtitle}</p>
                    )}

                    {/* Author and metadata */}
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-6">
                        <div className="flex items-center space-x-2">
                            <img
                                src={authorAvatarUrl || "https://randomuser.me/api/portraits/women/44.jpg"}
                                alt={article.author.name || 'Author'}
                                className="w-8 h-8 rounded-full object-cover"
                            />
                            <span className="font-medium">
                                {article.author?.name || article.author?.username || 'Anonymous'}
                            </span>
                        </div>
                        <span>•</span>
                        <span>{article.readTimeMin} min read</span>
                        {article.publishedAt && (
                            <>
                                <span>•</span>
                                <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                            </>
                        )}
                    </div>

                    {/* Cover image */}
                    {article.coverImage && coverImageUrl && (
                        <img
                            src={coverImageUrl}
                            alt={article.title}
                            className="w-full h-64 object-cover rounded-lg mb-6"
                        />
                    )}
                </div>

                {/* Article Content */}
                <div className="prose prose-lg max-w-none">
                    {article.contentHtml ? (
                        <>
                            <div
                                className="article-content"
                                dangerouslySetInnerHTML={{ __html: article.contentHtml }}
                                style={{
                                    lineHeight: '1.7',
                                }}
                            />
                            <style dangerouslySetInnerHTML={{
                                __html: `
                                    .article-content {
                                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                                        color: #374151;
                                    }
                                    .article-content img {
                                        max-width: 100%;
                                        height: auto;
                                        border-radius: 8px;
                                        margin: 1.5rem 0;
                                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                                    }
                                    .article-content p {
                                        margin-bottom: 1.25rem;
                                        line-height: 1.7;
                                    }
                                    .article-content h1, .article-content h2, .article-content h3, .article-content h4, .article-content h5, .article-content h6 {
                                        margin-top: 2rem;
                                        margin-bottom: 1rem;
                                        font-weight: 600;
                                        color: #111827;
                                    }
                                    .article-content h1 { font-size: 2rem; }
                                    .article-content h2 { font-size: 1.75rem; }
                                    .article-content h3 { font-size: 1.5rem; }
                                    .article-content h4 { font-size: 1.25rem; }
                                    .article-content h5 { font-size: 1.125rem; }
                                    .article-content h6 { font-size: 1rem; }
                                    .article-content ul, .article-content ol {
                                        margin: 1rem 0;
                                        padding-left: 2rem;
                                    }
                                    .article-content li {
                                        margin-bottom: 0.5rem;
                                    }
                                    .article-content blockquote {
                                        border-left: 4px solid #e5e7eb;
                                        padding-left: 1rem;
                                        margin: 1.5rem 0;
                                        font-style: italic;
                                        color: #6b7280;
                                    }
                                    .article-content code {
                                        background-color: #f3f4f6;
                                        padding: 0.125rem 0.25rem;
                                        border-radius: 0.25rem;
                                        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                                        font-size: 0.875rem;
                                    }
                                    .article-content pre {
                                        background-color: #1f2937;
                                        color: #f9fafb;
                                        padding: 1rem;
                                        border-radius: 0.5rem;
                                        overflow-x: auto;
                                        margin: 1.5rem 0;
                                    }
                                    .article-content pre code {
                                        background-color: transparent;
                                        padding: 0;
                                        color: inherit;
                                    }
                                    .article-content table {
                                        width: 100%;
                                        border-collapse: collapse;
                                        margin: 1.5rem 0;
                                    }
                                    .article-content th, .article-content td {
                                        border: 1px solid #e5e7eb;
                                        padding: 0.75rem;
                                        text-align: left;
                                    }
                                    .article-content th {
                                        background-color: #f9fafb;
                                        font-weight: 600;
                                    }
                                    .article-content a {
                                        color: #3b82f6;
                                        text-decoration: underline;
                                    }
                                    .article-content a:hover {
                                        color: #1d4ed8;
                                    }
                                    .article-content strong {
                                        font-weight: 600;
                                    }
                                    .article-content em {
                                        font-style: italic;
                                    }
                                    .article-content hr {
                                        border: none;
                                        border-top: 1px solid #e5e7eb;
                                        margin: 2rem 0;
                                    }
                                `
                            }} />
                        </>
                    ) : (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-yellow-800">No content available for this article.</p>
                        </div>
                    )}
                </div>

                {/* Engagement Section */}
                <ArticleEngagement
                    article={article}
                    disabled={!isAuthenticated}
                    hasAccess={hasAccess}
                />

                {/* Call to action */}
                <div className="mt-8 p-6 bg-gray-50 rounded-lg text-center">
                    <h3 className="text-xl font-semibold mb-2">Enjoyed this article?</h3>
                    <p className="text-gray-600 mb-4">
                        Join Ambrosia to discover more great content and connect with writers.
                    </p>
                    <a
                        href="/"
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 inline-block"
                    >
                        Sign Up Free
                    </a>
                </div>
            </div>
        </div>
    );
}