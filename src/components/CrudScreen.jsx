// components/CrudScreen.jsx
'use client';

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function CrudScreen({ vis }) {
  // Queries
  const me = useQuery(api.profiles.getMyProfile, {});
  const posts = useQuery(api.posts.getMyPosts, {});
  const allPosts = useQuery(api.posts.getAllPosts, { limit: 100 });

  // Mutations
  const setMyUsername = useMutation(api.profiles.setMyUsername);
  const createPost = useMutation(api.posts.createPost);
  const updatePost = useMutation(api.posts.updatePost);
  const deletePost = useMutation(api.posts.deletePost);
  const toggleLike = useMutation(api.posts.toggleLike);

  // Local state
  const [usernameInput, setUsernameInput] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [openComments, setOpenComments] = useState(null);

  // ── handlers (these MUST exist or React will crash)
  async function handleSetUsername() {
    if (!/^[a-z0-9_]{3,20}$/i.test(usernameInput.trim())) {
      alert("Invalid username. Use 3–20 letters, numbers, or _");
      return;
    }
    try {
      await setMyUsername({ username: usernameInput.trim().toLowerCase() });
      setUsernameInput("");
    } catch (err) {
      alert(err?.message || "Could not set username");
    }
  }

  async function handleSubmitPost() {
    if (!title.trim() || !content.trim()) {
      alert("Title and content required");
      return;
    }
    try {
      if (editingId) {
        await updatePost({ postId: editingId, title, content });
        setEditingId(null);
      } else {
        await createPost({ title, content });
      }
      setTitle("");
      setContent("");
    } catch (err) {
      alert(err?.message || "Post action failed");
    }
  }

  async function handleDelete(id) {
    if (!id) return;
    if (window.confirm("Delete this post?")) {
      try {
        await deletePost({ postId: id });
      } catch (err) {
        alert(err?.message || "Delete failed");
      }
    }
  }

  function startEdit(post) {
    setEditingId(post._id);
    setTitle(post.title);
    setContent(post.content);
  }

  // utils
  function formatCount(n) {
    if (n < 1000) return String(n);
    if (n < 1_000_000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + "K";
    return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + "M";
  }
  function timeAgo(ms) {
    const diff = Date.now() - ms;
    const sec = Math.max(1, Math.floor(diff / 1000));
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const d = Math.floor(hr / 24);
    if (d < 7) return `${d}d ago`;
    const w = Math.floor(d / 7);
    if (w < 5) return `${w}w ago`;
    const mo = Math.floor(d / 30);
    if (mo < 12) return `${mo}mo ago`;
    const y = Math.floor(d / 365);
    return `${y}y ago`;
  }

  // Comments widget
  function CommentThread({ postId }) {
    const comments = useQuery(api.comments.listForPost, { postId, limit: 50 });
    const createComment = useMutation(api.comments.createComment);
    const toggleCommentLike = useMutation(api.comments.toggleCommentLike);
    const [text, setText] = useState("");

    if (comments === undefined) return <p className="text-sm text-gray-500">Loading comments…</p>;

    async function handleAdd() {
      if (!text.trim()) return;
      await createComment({ postId, content: text });
      setText("");
    }

    return (
      <div className="mt-2 border-t pt-2">
        {comments.length === 0 && <p className="text-sm text-gray-500">No comments yet.</p>}
        {comments.map((c) => (
          <div key={c._id} className="mb-2">
            <div className="flex justify-between items-center text-sm">
              <span>
                {c.username ? `@${c.username}` : "anonymous"} · {timeAgo(c.createdAt)}
              </span>
              <button
                onClick={() => toggleCommentLike({ commentId: c._id })}
                className={`px-2 py-0.5 rounded border text-xs ${
                  c.likedByMe ? "bg-rose-50 border-rose-300 text-rose-600" : "border-gray-300"
                }`}
              >
                {c.likedByMe ? "♥" : "♡"} {formatCount(c.likeCount ?? 0)}
              </button>
            </div>
            <p className="ml-2 text-sm">{c.content}</p>
          </div>
        ))}
        <div className="flex gap-2 mt-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment…"
            className="border p-1 rounded flex-1 text-sm"
          />
          <button
            onClick={handleAdd}
            disabled={!text.trim()}
            className="bg-accent text-white px-3 py-1 rounded text-sm"
          >
            Post
          </button>
        </div>
      </div>
    );
  }

  const loading = me === undefined || posts === undefined || allPosts === undefined;

  async function onToggleLike(postId) {
    try {
      await toggleLike({ postId });
    } catch (e) {
      alert(e?.message ?? "Could not like/unlike");
    }
  }

  return (
    <>
      <div id="crud-screen" className={(vis?.("crud-screen") ?? "") + " p-4"}>
        <h2 className="text-xl font-bold mb-4">CRUD Dashboard</h2>

        {loading && <p className="text-sm text-gray-500">Loading…</p>}

        {!loading && me?.username && (
          <p className="text-gray-700 mb-4">
            Logged in as <span className="font-semibold">@{me.username}</span>
          </p>
        )}

        {!loading && !me?.username ? (
          <div className="mb-6">
            <p className="mb-2">Choose a username to continue:</p>
            <div className="flex gap-2">
              <input
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="your_username"
                className="border p-2 flex-1 rounded"
              />
              <button
                onClick={handleSetUsername}
                className="bg-accent text-white px-4 py-2 rounded"
                disabled={!usernameInput.trim()}
              >
                Set Username
              </button>
            </div>
          </div>
        ) : null}

        {!loading && me?.username && (
          <>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Create / Update Post</h3>
              <input
                className="block border p-2 w-full mb-2 rounded"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                className="block border p-2 w-full mb-2 rounded"
                placeholder="Content"
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <button onClick={handleSubmitPost} className="bg-accent text-white px-4 py-2 rounded">
                {editingId ? "Update" : "Create"} Post
              </button>
              {editingId && (
                <button
                  onClick={() => {
                    setEditingId(null);
                    setTitle("");
                    setContent("");
                  }}
                  className="ml-2 px-4 py-2 border rounded"
                >
                  Cancel
                </button>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Your Posts</h3>
              {posts && posts.length === 0 && <p>No posts yet.</p>}
              {posts &&
                posts.map((post) => (
                  <div key={post._id} className="border p-3 mb-3 rounded">
                    <h4 className="font-bold">{post.title}</h4>
                    <p className="whitespace-pre-wrap">{post.content}</p>
                    <div className="mt-2 flex gap-4 text-sm">
                      <button onClick={() => startEdit(post)} className="text-blue-600 underline">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(post._id)} className="text-red-600 underline">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}
      </div>

      {/* All Users’ Posts */}
      <div className="mt-10 p-4">
        <h3 className="text-lg font-semibold mb-2">All Users’ Posts</h3>
        {allPosts && allPosts.length === 0 && <p>No posts yet.</p>}
        {allPosts &&
          allPosts.map((post) => (
            <div key={post._id} className="border p-3 mb-3 rounded">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-bold">{post.title}</h4>
                {post.username ? (
                  <span className="text-sm text-gray-500">@{post.username}</span>
                ) : (
                  <span className="text-sm text-gray-400">anonymous</span>
                )}
              </div>

              <p className="whitespace-pre-wrap">{post.content}</p>

              <div className="mt-2 flex items-center gap-4 text-sm">
                <button
                  onClick={() => onToggleLike(post._id)}
                  className={`px-2 py-1 rounded border ${
                    post.likedByMe ? "bg-rose-50 border-rose-300 text-rose-600" : "border-gray-300"
                  }`}
                >
                  {post.likedByMe ? "♥" : "♡"} {formatCount(post.likeCount ?? 0)}
                </button>
                <span className="text-gray-500">{timeAgo(post._creationTime)}</span>

                <button
                  onClick={() => setOpenComments((cur) => (cur === post._id ? null : post._id))}
                  className="text-blue-600 underline"
                >
                  {openComments === post._id ? "Hide comments" : "Comments"}
                </button>
              </div>

              {openComments === post._id && <CommentThread postId={post._id} />}
            </div>
          ))}
      </div>
    </>
  );
}
