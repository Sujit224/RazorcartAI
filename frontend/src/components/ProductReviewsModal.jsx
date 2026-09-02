import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Star, X, MessageSquare, Send, CheckCircle2, MapPin } from 'lucide-react';

export function ProductReviewsModal({ product, isOpen, onClose, onReviewSubmitted }) {
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && product?.id) {
      fetchReviews();
    }
  }, [isOpen, product?.id]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await api.getProductReviews(product.id);
      setReviews(res.data || []);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setErrorMsg('Please write a review comment.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      await api.createProductReview(product.id, {
        user_id: currentUser?.id || 1,
        rating: Number(rating),
        comment: comment.trim(),
      });
      setComment('');
      setRating(5);
      setSuccessMsg('Review submitted successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchReviews();
      if (onReviewSubmitted) onReviewSubmitted();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 bg-[#282c3f] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            {product.image_url && (
              <img src={product.image_url} alt="" className="w-12 h-12 rounded-lg object-cover border border-white/20" />
            )}
            <div>
              <h3 className="font-extrabold text-sm text-white line-clamp-1">{product.title}</h3>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-300">
                <span className="font-bold text-amber-400 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {product.rating || 4.5}
                </span>
                <span>•</span>
                <span>{product.review_count || 0} Ratings & Reviews</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          
          {/* Write a Review Section */}
          <div className="bg-pink-50/60 border border-pink-100 p-4 rounded-xl space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#ff3f6c] flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" /> Rate & Review this Product
            </h4>

            {successMsg && (
              <div className="p-2.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-2.5 bg-red-100 text-red-700 text-xs font-bold rounded-lg">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Your Rating</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 text-amber-400 hover:scale-110 transition-transform"
                    >
                      <Star className={`w-6 h-6 ${star <= rating ? 'fill-amber-400' : 'text-gray-300'}`} />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-bold text-gray-700">{rating}.0 / 5.0</span>
                </div>
              </div>

              <div>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience (e.g. fit, comfort, material, delivery speed)..."
                  className="w-full p-3 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#ff3f6c] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-lg bg-[#ff3f6c] text-white font-extrabold text-xs uppercase tracking-wider shadow hover:bg-[#e0355d] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Submitting...' : 'Submit Review'}</span>
              </button>
            </form>
          </div>

          {/* Reviews List */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
              Customer Reviews ({reviews.length})
            </h4>

            {loading ? (
              <div className="py-8 text-center text-xs text-gray-400">Loading reviews...</div>
            ) : reviews.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400 italic">
                No reviews written yet. Be the first to review!
              </div>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-gray-900">{rev.user_name}</span>
                      {rev.user_city && (
                        <span className="text-[10px] text-gray-500 font-semibold flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5 text-[#ff3f6c]" /> {rev.user_city}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-extrabold text-amber-800">{rev.rating}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">{rev.comment}</p>
                  <span className="text-[10px] text-gray-400 block font-mono">
                    {new Date(rev.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              ))
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
