// src/features/courses/components/CourseReviewModal.tsx
import React, { useState } from 'react';
import { Star, CheckCircle2, MessageSquare, Sparkles } from 'lucide-react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';
import { SubmitReviewInput, CourseReviewRecord } from '../../../types/courses';

interface CourseReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseTitle: string;
  courseId: string;
  existingReview?: CourseReviewRecord | null;
  onSubmitReview: (data: SubmitReviewInput) => Promise<void>;
}

export function CourseReviewModal({
  open,
  onOpenChange,
  courseTitle,
  courseId,
  existingReview,
  onSubmitReview,
}: CourseReviewModalProps) {
  const [rating, setRating] = useState<number>(existingReview?.rating || 5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [learnedSummary, setLearnedSummary] = useState(existingReview?.learned_summary || '');
  const [understandingSummary, setUnderstandingSummary] = useState(existingReview?.understanding_summary || '');
  const [usefulConcepts, setUsefulConcepts] = useState(existingReview?.useful_concepts || '');
  const [practicalApplication, setPracticalApplication] = useState(existingReview?.practical_application || '');
  const [improvementFeedback, setImprovementFeedback] = useState(existingReview?.improvement_feedback || '');
  const [overallFeedback, setOverallFeedback] = useState(existingReview?.overall_feedback || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!learnedSummary.trim() || !understandingSummary.trim() || !usefulConcepts.trim() || !practicalApplication.trim()) {
      setError('Please answer all key learning prompts before submitting your review.');
      return;
    }

    if (!overallFeedback.trim()) {
      setError('Please provide a brief overall review summary.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmitReview({
        course_id: courseId,
        rating,
        learned_summary: learnedSummary,
        understanding_summary: understandingSummary,
        useful_concepts: usefulConcepts,
        practical_application: practicalApplication,
        improvement_feedback: improvementFeedback,
        overall_feedback: overallFeedback,
      });
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle className="text-base font-semibold flex items-center gap-2 text-slate-900">
          <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
          {existingReview ? 'Course Review Submitted' : 'Submit Course Review & Feedback'}
        </DialogTitle>
        <DialogDescription className="text-xs text-slate-500">
          {courseTitle}
        </DialogDescription>
      </DialogHeader>

      {existingReview ? (
        <div className="space-y-4 py-2 text-xs">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-semibold text-emerald-900">Review Verified & Submitted</h4>
              <p className="text-[11px] text-emerald-700">
                Your feedback has been securely registered and shared with your mentors and cohort administrators.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700">Your Rating:</span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= existingReview.rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[11px] font-bold text-slate-700 ml-1">({existingReview.rating} / 5)</span>
            </div>

            <div>
              <span className="font-semibold text-slate-700 block">What you learned:</span>
              <p className="text-slate-600 mt-0.5">{existingReview.learned_summary}</p>
            </div>

            <div>
              <span className="font-semibold text-slate-700 block">Key understanding & concepts:</span>
              <p className="text-slate-600 mt-0.5">{existingReview.useful_concepts}</p>
            </div>

            <div>
              <span className="font-semibold text-slate-700 block">Practical application:</span>
              <p className="text-slate-600 mt-0.5">{existingReview.practical_application}</p>
            </div>

            {existingReview.overall_feedback && (
              <div>
                <span className="font-semibold text-slate-700 block">Overall feedback:</span>
                <p className="text-slate-600 mt-0.5 italic">"{existingReview.overall_feedback}"</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" onClick={() => onOpenChange(false)} className="w-full sm:w-auto h-8 text-xs">
              Close
            </Button>
          </DialogFooter>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3 py-1">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-600">
              {error}
            </div>
          )}

          {/* Interactive Star Rating */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">Overall Course Rating *</label>
            <div className="flex items-center gap-1.5 py-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 hover:scale-110 transition-transform focus:outline-hidden"
                  >
                    <Star
                      className={`h-6 w-6 transition-colors ${
                        filled ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                      }`}
                    />
                  </button>
                );
              })}
              <span className="text-xs font-medium text-slate-600 ml-2">
                {rating === 5 ? 'Excellent (5/5)' : rating === 4 ? 'Very Good (4/5)' : rating === 3 ? 'Good (3/5)' : `${rating}/5 Stars`}
              </span>
            </div>
          </div>

          {/* Prompt 1 */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">
              1. What did you learn from this course? *
            </label>
            <Textarea
              rows={2}
              value={learnedSummary}
              onChange={(e) => setLearnedSummary(e.target.value)}
              placeholder="Detail the technical skills, architectural workflows, or tools you learned..."
              className="text-xs"
              required
            />
          </div>

          {/* Prompt 2 */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">
              2. What did you understand most clearly? *
            </label>
            <Textarea
              rows={2}
              value={understandingSummary}
              onChange={(e) => setUnderstandingSummary(e.target.value)}
              placeholder="Describe concepts or principles that became crystal clear..."
              className="text-xs"
              required
            />
          </div>

          {/* Prompt 3 */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">
              3. What were the most useful concepts? *
            </label>
            <Textarea
              rows={2}
              value={usefulConcepts}
              onChange={(e) => setUsefulConcepts(e.target.value)}
              placeholder="Highlight modules, syntax patterns, or tips you found most valuable..."
              className="text-xs"
              required
            />
          </div>

          {/* Prompt 4 */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">
              4. How will you apply what you learned in your internship tasks? *
            </label>
            <Textarea
              rows={2}
              value={practicalApplication}
              onChange={(e) => setPracticalApplication(e.target.value)}
              placeholder="Explain how you will implement this in your daily project deliverables..."
              className="text-xs"
              required
            />
          </div>

          {/* Prompt 5 */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">
              5. What could be improved? (Optional)
            </label>
            <Textarea
              rows={1}
              value={improvementFeedback}
              onChange={(e) => setImprovementFeedback(e.target.value)}
              placeholder="Topics you would like more exercises or modules on..."
              className="text-xs"
            />
          </div>

          {/* Overall Review */}
          <div className="space-y-1 pt-1 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-700 block">
              Overall Review / Summary Feedback *
            </label>
            <Textarea
              rows={2}
              value={overallFeedback}
              onChange={(e) => setOverallFeedback(e.target.value)}
              placeholder="Write your comprehensive summary review of this course..."
              className="text-xs font-medium"
              required
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-8 text-xs">
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="h-8 text-xs bg-amber-500 hover:bg-amber-600 text-white font-medium"
            >
              {isSubmitting ? 'Submitting Review...' : 'Submit Course Review'}
            </Button>
          </DialogFooter>
        </form>
      )}
    </Dialog>
  );
}
