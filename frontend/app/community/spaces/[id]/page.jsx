'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function SpaceDetail() {
  const params = useParams();
  const router = useRouter();
  const spaceId = params.id;
  
  const [space, setSpace] = useState(null);
  const [posts, setPosts] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newPost, setNewPost] = useState({ title: '', content: '', post_type: 'discussion' });
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    loadSpace();
    loadPosts();
    loadMembers();
  }, [spaceId]);

  const loadSpace = async () => {
    try {
      const res = await fetch(`/api/v1/community/spaces/${spaceId}`);
      const data = await res.json();
      setSpace(data.space);
    } catch (error) {
      console.error('Error loading space:', error);
    }
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/community/spaces/${spaceId}/posts`);
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
    setLoading(false);
  };

  const loadMembers = async () => {
    try {
      const res = await fetch(`/api/v1/community/spaces/${spaceId}/members`);
      const data = await res.json();
      setMembers(data.members || []);
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const loadComments = async (postId) => {
    try {
      const res = await fetch(`/api/v1/community/posts/${postId}/comments`);
      const data = await res.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/v1/community/spaces/${spaceId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost)
      });
      if (res.ok) {
        setShowPostModal(false);
        setNewPost({ title: '', content: '', post_type: 'discussion' });
        loadPosts();
      }
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleAddComment = async (postId) => {
    if (!newComment.trim()) return;
    try {
      const res = await fetch(`/api/v1/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment })
      });
      if (res.ok) {
        setNewComment('');
        loadComments(postId);
        loadPosts(); // Refresh to update comment count
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleReaction = async (targetType, targetId) => {
    try {
      await fetch('/api/v1/community/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_type: targetType, target_id: targetId, reaction_type: 'like' })
      });
      if (targetType === 'post') {
        loadPosts();
      } else {
        loadComments(selectedPost.id);
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const openPost = (post) => {
    setSelectedPost(post);
    loadComments(post.id);
  };

  if (!space) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading space...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <button
            onClick={() => router.push('/community')}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
          >
            ← Back to Community
          </button>
          {space.cover_image_url && (
            <img src={space.cover_image_url} alt={space.name} className="w-full h-48 object-cover rounded-lg mb-6" />
          )}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{space.name}</h1>
              <p className="text-gray-600 mb-4">{space.description}</p>
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <span>👥 {space.member_count} members</span>
                <span>📝 {space.post_count} posts</span>
                <span className={`px-2 py-1 rounded ${
                  space.space_type === 'public' ? 'bg-green-100 text-green-800' :
                  space.space_type === 'private' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {space.space_type}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {['posts', 'members'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-sm font-medium capitalize ${
                    activeTab === tab
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Posts Tab */}
            {activeTab === 'posts' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Discussions</h2>
                  <button
                    onClick={() => setShowPostModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    New Post
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 mb-4">No posts yet. Start the conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <div
                        key={post.id}
                        className="bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => openPost(post)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            {post.is_pinned && (
                              <span className="inline-block px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded mr-2">
                                📌 Pinned
                              </span>
                            )}
                            <span className={`inline-block px-2 py-1 text-xs rounded ${
                              post.post_type === 'question' ? 'bg-purple-100 text-purple-800' :
                              post.post_type === 'announcement' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {post.post_type}
                            </span>
                          </div>
                        </div>
                        {post.title && <h3 className="text-lg font-semibold mb-2">{post.title}</h3>}
                        <p className="text-gray-600 mb-4 line-clamp-2">{post.content}</p>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center gap-4">
                            <span>👤 {post.author_name}</span>
                            <span>💬 {post.comment_count} comments</span>
                            <span>❤️ {post.like_count} likes</span>
                            <span>👁️ {post.view_count} views</span>
                          </div>
                          <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Members ({members.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {members.map((member) => (
                    <div key={member.user_id} className="bg-white border rounded-lg p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-lg font-semibold">
                          {(member.user_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold">{member.user_name}</h3>
                          <span className={`text-xs px-2 py-1 rounded ${
                            member.role === 'admin' ? 'bg-red-100 text-red-800' :
                            member.role === 'moderator' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {member.role}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        Joined {new Date(member.joined_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      {showPostModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Create New Post</h3>
            <form onSubmit={handleCreatePost}>
              <select
                className="w-full px-4 py-2 border rounded-lg mb-4"
                value={newPost.post_type}
                onChange={(e) => setNewPost({...newPost, post_type: e.target.value})}
              >
                <option value="discussion">Discussion</option>
                <option value="question">Question</option>
                <option value="announcement">Announcement</option>
              </select>
              <input
                type="text"
                placeholder="Title (optional)"
                className="w-full px-4 py-2 border rounded-lg mb-4"
                value={newPost.title}
                onChange={(e) => setNewPost({...newPost, title: e.target.value})}
              />
              <textarea
                placeholder="What's on your mind?"
                className="w-full px-4 py-2 border rounded-lg mb-4"
                rows="6"
                value={newPost.content}
                onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                required
              />
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPostModal(false);
                    setNewPost({ title: '', content: '', post_type: 'discussion' });
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6">
              <button
                onClick={() => setSelectedPost(null)}
                className="text-gray-600 hover:text-gray-800 mb-4"
              >
                ← Back
              </button>
              {selectedPost.title && <h2 className="text-2xl font-bold mb-2">{selectedPost.title}</h2>}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>👤 {selectedPost.author_name}</span>
                <span>{new Date(selectedPost.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="p-6">
              <div className="prose max-w-none mb-6">
                <p className="text-gray-800 whitespace-pre-wrap">{selectedPost.content}</p>
              </div>

              <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                <button
                  onClick={() => handleReaction('post', selectedPost.id)}
                  className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  ❤️ {selectedPost.like_count} Likes
                </button>
                <span className="text-gray-500">💬 {comments.length} Comments</span>
              </div>

              {/* Comments */}
              <div className="space-y-4 mb-6">
                <h3 className="font-semibold text-lg">Comments</h3>
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{comment.author_name}</span>
                        {comment.is_solution && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                            ✓ Solution
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-2">{comment.content}</p>
                    <button
                      onClick={() => handleReaction('comment', comment.id)}
                      className="text-sm text-gray-600 hover:text-blue-600"
                    >
                      ❤️ {comment.like_count}
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Comment */}
              <div className="border-t pt-6">
                <textarea
                  placeholder="Write a comment..."
                  className="w-full px-4 py-2 border rounded-lg mb-4"
                  rows="3"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button
                  onClick={() => handleAddComment(selectedPost.id)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Post Comment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
