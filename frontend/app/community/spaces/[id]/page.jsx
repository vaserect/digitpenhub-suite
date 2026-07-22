'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import {
  ArrowLeft, MessageSquare, Users, Heart, Eye, Pin, Lock, Award,
  ThumbsUp, Send, Plus, Globe, Shield, Clock, Calendar
} from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';

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
  const [newPostContent, setNewPostContent] = useState('');
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    loadSpace();
    loadPosts();
    loadMembers();
  }, [spaceId]);

  const loadSpace = async () => {
    try {
      const data = await apiFetch(`/api/v1/community/spaces/${spaceId}`);
      setSpace(data.space);
    } catch (err) { console.error('Error loading space:', err); }
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/v1/community/spaces/${spaceId}/posts`);
      setPosts(data.posts || []);
    } catch (err) { console.error('Error loading posts:', err); }
    setLoading(false);
  };

  const loadMembers = async () => {
    try {
      const data = await apiFetch(`/api/v1/community/spaces/${spaceId}/members`);
      setMembers(data.members || []);
    } catch (err) { console.error('Error loading members:', err); }
  };

  const loadComments = async (postId) => {
    try {
      const data = await apiFetch(`/api/v1/community/posts/${postId}/comments`);
      setComments(data.comments || []);
    } catch (err) { console.error('Error loading comments:', err); }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/v1/community/spaces/${spaceId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newPostContent, post_type: 'discussion' })
      });
      setShowPostModal(false);
      setNewPostContent('');
      toast.success('Post created!');
      loadPosts();
    } catch (err) { console.error('Error creating post:', err); toast.error('Failed to create post'); }
  };

  const handleAddComment = async (postId) => {
    if (!newComment.trim()) return;
    try {
      await apiFetch(`/api/v1/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment })
      });
      setNewComment('');
      toast.success('Comment added');
      loadComments(postId);
      loadPosts();
    } catch (err) { console.error('Error adding comment:', err); }
  };

  const handleReaction = async (targetType, targetId) => {
    try {
      await apiFetch('/api/v1/community/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_type: targetType, target_id: targetId, reaction_type: 'like' })
      });
      if (targetType === 'post') loadPosts();
      else loadComments(selectedPost.id);
    } catch (err) { console.error('Error reacting:', err); }
  };

  const openPost = (post) => {
    setSelectedPost(post);
    loadComments(post.id);
  };

  if (!space) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <button onClick={() => router.push('/community')}
            className="text-blue-600 hover:text-blue-700 mb-6 flex items-center gap-1 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Community
          </button>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold text-gray-900">{space.name}</h1>
                <span className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${
                  space.space_type === 'public' ? 'bg-green-50 text-green-700' :
                  space.space_type === 'private' ? 'bg-yellow-50 text-yellow-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {space.space_type === 'public' ? <Globe className="w-3 h-3" /> :
                   space.space_type === 'private' ? <Shield className="w-3 h-3" /> :
                   <Lock className="w-3 h-3" />}
                  {space.space_type}
                </span>
              </div>
              <p className="text-gray-500 mb-4">{space.description}</p>
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {space.member_count || 0} members</span>
                <span className="flex items-center gap-1.5"><MessageSquare className="w-4 h-4" /> {space.post_count || 0} posts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200 px-6">
            <div className="flex items-center justify-between">
              <nav className="flex -mb-px space-x-1">
                {['posts', 'members'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 capitalize transition-colors ${
                      activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}>
                    {tab === 'posts' ? (
                      <><MessageSquare className="w-4 h-4 inline mr-1.5" /> Posts</>
                    ) : (
                      <><Users className="w-4 h-4 inline mr-1.5" /> Members ({members.length})</>
                    )}
                  </button>
                ))}
              </nav>
              {activeTab === 'posts' && (
                <button onClick={() => setShowPostModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                  <Plus className="w-4 h-4" /> New Post
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'posts' && (
              loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-16">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                  <p className="text-gray-500 mb-6">Start the conversation — create the first post in this space.</p>
                  <button onClick={() => setShowPostModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Plus className="w-4 h-4" /> Create Post
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map(post => (
                    <div key={post.id}
                      className="border border-gray-200 rounded-xl p-6 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer"
                      onClick={() => openPost(post)}>
                      <div className="flex items-start gap-2 mb-3">
                        {post.is_pinned && <Pin className="w-4 h-4 text-yellow-500 mt-0.5" />}
                        {post.is_locked && <Lock className="w-4 h-4 text-gray-400 mt-0.5" />}
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          post.post_type === 'question' ? 'bg-purple-50 text-purple-700' :
                          post.post_type === 'announcement' ? 'bg-blue-50 text-blue-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>{post.post_type}</span>
                      </div>
                      {post.title && <h3 className="font-semibold text-gray-900 mb-2">{post.title}</h3>}
                      <div className="text-gray-600 mb-4 line-clamp-3 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: post.content }} />
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-4">
                          <span>{post.author_name}</span>
                          <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {post.like_count || 0}</span>
                          <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {post.comment_count || 0}</span>
                          <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {post.view_count || 0}</span>
                        </div>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {activeTab === 'members' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {members.map(member => (
                  <div key={member.user_id} className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {(member.user_name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{member.user_name}</h3>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          member.role === 'admin' ? 'bg-red-50 text-red-700' :
                          member.role === 'moderator' ? 'bg-yellow-50 text-yellow-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>{member.role}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">
                      Joined <span className="font-medium">{new Date(member.joined_at).toLocaleDateString()}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      {showPostModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6">Create a Post</h3>
            <form onSubmit={handleCreatePost}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                <RichTextEditor
                  value={newPostContent}
                  onChange={setNewPostContent}
                  placeholder="What's on your mind?"
                />
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => { setShowPostModal(false); setNewPostContent(''); }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={!newPostContent.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" /> Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
              <button onClick={() => setSelectedPost(null)} className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-1 text-sm font-medium">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div className="flex items-center gap-2 mb-2">
                {selectedPost.is_pinned && <Pin className="w-4 h-4 text-yellow-500" />}
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  selectedPost.post_type === 'question' ? 'bg-purple-50 text-purple-700' :
                  selectedPost.post_type === 'announcement' ? 'bg-blue-50 text-blue-700' :
                  'bg-gray-100 text-gray-600'
                }`}>{selectedPost.post_type}</span>
              </div>
              {selectedPost.title && <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedPost.title}</h2>}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{selectedPost.author_name}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(selectedPost.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="p-6">
              <div className="prose max-w-none mb-6" dangerouslySetInnerHTML={{ __html: selectedPost.content }} />

              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
                <button onClick={() => handleReaction('post', selectedPost.id)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                  <ThumbsUp className="w-4 h-4" /> {selectedPost.like_count || 0} Likes
                </button>
                <span className="text-sm text-gray-500 flex items-center gap-1"><MessageSquare className="w-4 h-4" /> {comments.length} Comments</span>
              </div>

              {/* Comments */}
              <div className="space-y-4 mb-6">
                <h3 className="font-semibold text-lg text-gray-900">Comments</h3>
                {comments.length === 0 && (
                  <p className="text-gray-500 text-sm py-4">No comments yet. Be the first to respond!</p>
                )}
                {comments.map(comment => (
                  <div key={comment.id} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{comment.author_name}</span>
                        {comment.is_solution && (
                          <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700 rounded-full">
                            <Award className="w-3 h-3" /> Solution
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="text-gray-700 mb-2 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: comment.content }} />
                    <button onClick={() => handleReaction('comment', comment.id)}
                      className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors">
                      <ThumbsUp className="w-3.5 h-3.5" /> {comment.like_count || 0}
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Comment */}
              <div className="border-t border-gray-200 pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Add a comment</label>
                <RichTextEditor
                  value={newComment}
                  onChange={setNewComment}
                  placeholder="Write a comment..."
                />
                <button onClick={() => handleAddComment(selectedPost.id)}
                  disabled={!newComment.trim()}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm">
                  <Send className="w-4 h-4" /> Post Comment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
