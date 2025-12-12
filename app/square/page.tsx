"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart,
  Bookmark,
  MessageCircle,
  Send,
  Plus,
  User,
  Clock,
  Copy,
  Loader2,
  X,
} from "lucide-react";
import { Button, Input, Textarea, Modal, useToast } from "@/components/ui";
import { cn, formatRelativeTime, copyToClipboard } from "@/lib/utils";

interface Post {
  id: string;
  userId: string;
  title: string;
  content: string;
  description?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  author: {
    username: string;
    avatarUrl?: string;
  };
  likesCount: number;
  bookmarksCount: number;
  commentsCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
}

interface Comment {
  id: string;
  postId: string;
  content: string;
  createdAt: string;
  author: {
    username: string;
    avatarUrl?: string;
  };
}

export default function SquarePage() {
  const toast = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    username: string;
  } | null>(null);

  // 发布弹窗
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [publishForm, setPublishForm] = useState({
    title: "",
    content: "",
    description: "",
  });
  const [isPublishing, setIsPublishing] = useState(false);

  // 评论弹窗
  const [commentPost, setCommentPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // 加载用户信息
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = (await res.json()) as {
          success: boolean;
          data?: { id: string; username: string };
        };
        if (data.success && data.data) {
          setCurrentUser(data.data);
        }
      } catch {
        // 未登录
      }
    };
    loadUser();
  }, []);

  // 加载帖子
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const res = await fetch("/api/posts");
        const data = (await res.json()) as { success: boolean; data?: Post[] };
        if (data.success) {
          setPosts(data.data || []);
        }
      } catch {
        toast.error("加载失败");
      } finally {
        setIsLoading(false);
      }
    };
    loadPosts();
  }, []);

  // 点赞
  const handleLike = async (post: Post) => {
    if (!currentUser) {
      toast.error("请先登录");
      return;
    }

    try {
      const res = await fetch("/api/posts/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      });
      const data = (await res.json()) as {
        success: boolean;
        data?: { liked: boolean };
      };

      if (data.success) {
        setPosts(
          posts.map((p) =>
            p.id === post.id
              ? {
                  ...p,
                  isLiked: data.data?.liked ?? !p.isLiked,
                  likesCount: data.data?.liked
                    ? p.likesCount + 1
                    : p.likesCount - 1,
                }
              : p
          )
        );
      }
    } catch {
      toast.error("操作失败");
    }
  };

  // 收藏
  const handleBookmark = async (post: Post) => {
    if (!currentUser) {
      toast.error("请先登录");
      return;
    }

    try {
      const res = await fetch("/api/posts/bookmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      });
      const data = (await res.json()) as {
        success: boolean;
        data?: { bookmarked: boolean };
      };

      if (data.success) {
        setPosts(
          posts.map((p) =>
            p.id === post.id
              ? {
                  ...p,
                  isBookmarked: data.data?.bookmarked ?? !p.isBookmarked,
                  bookmarksCount: data.data?.bookmarked
                    ? p.bookmarksCount + 1
                    : p.bookmarksCount - 1,
                }
              : p
          )
        );
        toast.success(data.data?.bookmarked ? "已收藏" : "已取消收藏");
      }
    } catch {
      toast.error("操作失败");
    }
  };

  // 复制内容
  const handleCopy = async (content: string) => {
    const success = await copyToClipboard(content);
    if (success) {
      toast.success("已复制到剪贴板");
    } else {
      toast.error("复制失败");
    }
  };

  // 发布帖子
  const handlePublish = async () => {
    if (!publishForm.title.trim() || !publishForm.content.trim()) {
      toast.error("请填写标题和内容");
      return;
    }

    setIsPublishing(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(publishForm),
      });
      const data = (await res.json()) as { success: boolean; error?: string };

      if (data.success) {
        toast.success("发布成功");
        setIsPublishOpen(false);
        setPublishForm({ title: "", content: "", description: "" });
        // 刷新列表
        const postsRes = await fetch("/api/posts");
        const postsData = (await postsRes.json()) as {
          success: boolean;
          data?: Post[];
        };
        if (postsData.success) {
          setPosts(postsData.data || []);
        }
      } else {
        toast.error(data.error || "发布失败");
      }
    } catch {
      toast.error("发布失败");
    } finally {
      setIsPublishing(false);
    }
  };

  // 打开评论
  const openComments = async (post: Post) => {
    setCommentPost(post);
    setIsLoadingComments(true);
    try {
      const res = await fetch(`/api/posts/comments?postId=${post.id}`);
      const data = (await res.json()) as { success: boolean; data?: Comment[] };
      if (data.success) {
        setComments(data.data || []);
      }
    } catch {
      toast.error("加载评论失败");
    } finally {
      setIsLoadingComments(false);
    }
  };

  // 发表评论
  const submitComment = async () => {
    if (!newComment.trim() || !commentPost) return;

    setIsSubmittingComment(true);
    try {
      const res = await fetch("/api/posts/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: commentPost.id, content: newComment }),
      });
      const data = (await res.json()) as {
        success: boolean;
        data?: Comment;
        error?: string;
      };

      if (data.success && data.data) {
        setComments([...comments, data.data]);
        setNewComment("");
        setPosts(
          posts.map((p) =>
            p.id === commentPost.id
              ? { ...p, commentsCount: p.commentsCount + 1 }
              : p
          )
        );
        toast.success("评论成功");
      } else {
        toast.error(data.error || "评论失败");
      }
    } catch {
      toast.error("评论失败");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div className="container py-8">
      {/* 页面标题 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">提示词广场</h1>
          <p className="mt-1 text-muted-foreground">发现和分享优质提示词</p>
        </div>
        {currentUser && (
          <Button onClick={() => setIsPublishOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            发布提示词
          </Button>
        )}
      </motion.div>

      {/* 帖子列表 */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-64 rounded-2xl bg-card animate-pulse border border-border"
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <p className="text-muted-foreground">还没有帖子，来发布第一个吧！</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          <AnimatePresence>
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group rounded-2xl border border-border bg-card p-5 hover:shadow-lg transition-all"
              >
                {/* 作者信息 */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-linear-to-br from-primary to-secondary flex items-center justify-center text-white font-medium">
                    {post.author.avatarUrl ? (
                      <img
                        src={post.author.avatarUrl}
                        alt=""
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {post.author.username}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(post.createdAt)}
                    </p>
                  </div>
                </div>

                {/* 内容 */}
                <h3 className="font-semibold text-foreground mb-2 line-clamp-1">
                  {post.title}
                </h3>
                {post.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {post.description}
                  </p>
                )}
                <div className="rounded-lg bg-muted/30 p-3 border border-border/50 mb-4">
                  <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                    {post.content}
                  </p>
                </div>

                {/* 操作栏 */}
                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleLike(post)}
                      className={cn(
                        "flex items-center gap-1 text-sm transition-colors",
                        post.isLiked
                          ? "text-red-500"
                          : "text-muted-foreground hover:text-red-500"
                      )}
                    >
                      <Heart
                        className={cn(
                          "h-4 w-4",
                          post.isLiked && "fill-current"
                        )}
                      />
                      {post.likesCount}
                    </button>
                    <button
                      onClick={() => handleBookmark(post)}
                      className={cn(
                        "flex items-center gap-1 text-sm transition-colors",
                        post.isBookmarked
                          ? "text-amber-500"
                          : "text-muted-foreground hover:text-amber-500"
                      )}
                    >
                      <Bookmark
                        className={cn(
                          "h-4 w-4",
                          post.isBookmarked && "fill-current"
                        )}
                      />
                      {post.bookmarksCount}
                    </button>
                    <button
                      onClick={() => openComments(post)}
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {post.commentsCount}
                    </button>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(post.content)}
                    className="gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    复制
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* 发布弹窗 */}
      <Modal
        isOpen={isPublishOpen}
        onClose={() => setIsPublishOpen(false)}
        title="发布提示词"
        description="分享你的优质提示词给社区"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">标题 *</label>
            <Input
              placeholder="给你的提示词起个标题"
              value={publishForm.title}
              onChange={(e) =>
                setPublishForm({ ...publishForm, title: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">描述</label>
            <Input
              placeholder="简要描述这个提示词的用途（可选）"
              value={publishForm.description}
              onChange={(e) =>
                setPublishForm({ ...publishForm, description: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">内容 *</label>
            <Textarea
              placeholder="输入提示词内容..."
              value={publishForm.content}
              onChange={(e) =>
                setPublishForm({ ...publishForm, content: e.target.value })
              }
              className="min-h-[150px]"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsPublishOpen(false)}>
              取消
            </Button>
            <Button onClick={handlePublish} disabled={isPublishing}>
              {isPublishing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  发布中...
                </>
              ) : (
                "发布"
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 评论弹窗 */}
      <Modal
        isOpen={!!commentPost}
        onClose={() => {
          setCommentPost(null);
          setComments([]);
          setNewComment("");
        }}
        title="评论"
        size="md"
      >
        <div className="space-y-4">
          {isLoadingComments ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">暂无评论</p>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-3">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="flex gap-3 p-3 rounded-lg bg-muted/30"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium shrink-0">
                    {comment.author.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {comment.author.username}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {currentUser && (
            <div className="flex gap-2 pt-3 border-t">
              <Input
                placeholder="写下你的评论..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !e.shiftKey && submitComment()
                }
              />
              <Button
                onClick={submitComment}
                disabled={isSubmittingComment || !newComment.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
