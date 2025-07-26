import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import useAxiosRequest from '@/services/axiosInspector';

// Star rating using shadcn Button
const Star = ({
  filled,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: {
  filled: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) => (
  <span
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    style={{ display: 'inline-block' }}
  >
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      style={{
        color: filled ? '#FFD700' : '#ccc',
        fontSize: 28,
        padding: 0,
        marginRight: 4,
        transition: 'color 0.2s',
      }}
      aria-label={filled ? 'Filled star' : 'Empty star'}
      tabIndex={0}
    >
      ★
    </Button>
  </span>
);

const Feedback: React.FC = () => {
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { axiosInstance } = useAxiosRequest();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await axiosInstance.post('/feedback', {
        comment: message,
        rating,
      });
      setSubmitted(true);
    } catch (err) {
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-stretch bg-background">
      <div className="md:w-1/2 flex items-center justify-center px-8 py-12">
        <img
          src="/logo.png"
          alt="Feedback"
          className="object-cover max-h-80 w-full rounded-lg"
        />
      </div>
      <div className="md:w-1/2 flex flex-col justify-center px-8 py-12">
        <h2 className="text-3xl font-bold text-primary mb-4 text-center max-w-md mx-auto">
          Share Your Feedback
        </h2>
        <p className="text-muted-foreground text-lg mb-8 text-center max-w-md mx-auto">
          We value your thoughts and suggestions. Please let us know how we can
          improve your experience or what you enjoyed most!
        </p>
        <div className="w-full max-w-md mx-auto">
          {submitted ? (
            <div className="text-center text-green-600 text-lg">
              <p>Thank you for your feedback!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <Label
                  htmlFor="message"
                  className="mb-2 block font-medium text-muted-foreground"
                >
                  Your Message
                </Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  required
                  placeholder="Let us know your thoughts..."
                  className="resize-vertical"
                  disabled={loading}
                />
              </div>
              <div className="mb-6">
                <Label className="mb-2 block font-medium text-muted-foreground">
                  Rating
                </Label>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <Star
                      key={num}
                      filled={hoverRating ? num <= hoverRating : num <= rating}
                      onClick={() => setRating(num)}
                      onMouseEnter={() => setHoverRating(num)}
                      onMouseLeave={() => setHoverRating(0)}
                    />
                  ))}
                  <span className="ml-3 text-primary text-base">
                    {rating ? `${rating}/5` : ''}
                  </span>
                </div>
              </div>
              {error && (
                <div className="text-red-500 text-sm mb-4 text-center">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                className="w-full text-lg font-semibold"
                disabled={!message || !rating || loading}
              >
                {loading ? 'Submitting...' : 'Submit'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Feedback;
