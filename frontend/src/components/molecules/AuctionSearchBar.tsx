import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '@/services/axiosInstance';

interface Seller {
  username: string;
  firstName: string;
  lastName: string;
  profilePicture?: {
    id: string;
  } | null;
}

interface AuctionResult {
  id: string;
  title: string;
  category: string;
  seller: Seller;
  images: string[];
}

const getImageUrl = (uuid?: string) => {
  return uuid
    ? `${import.meta.env.VITE_API_URL}/auctions/getAuctionImages?file_uuid=${uuid}`
    : '';
};

export default function AuctionSearchBar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AuctionResult[]>([]);
  const [imageLoadedMap, setImageLoadedMap] = useState<Record<string, boolean>>(
    {},
  );
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  const setupAndSyncSearchQuery = (q: string) => {
    const trimmed = q.trim();

    if (location.pathname.startsWith('/explore-auctions')) {
      setQuery(q);

      const searchParams = new URLSearchParams(location.search);
      searchParams.set('q', trimmed);
      setSearchParams(searchParams);
    } else {
      setQuery(q);
    }
  };

  useEffect(() => {
    if (location.pathname.startsWith('/explore-auctions')) {
      const initialQTrimmed = initialQuery.trim();
      setQuery(initialQTrimmed);
    }
  }, [initialQuery, location.pathname]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.trim().length >= 1) {
        axiosInstance
          .get(`/auctions/search?q=${encodeURIComponent(query)}`)
          .then((res) => {
            setResults(res.data);
            if (isFocused) {
              setShowDropdown(true);
            }
          })
          .catch(() => {
            setResults([]);
            setShowDropdown(false);
          });
      } else {
        setShowDropdown(false);
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query, isFocused]);
  // Hide dropdown when clicking outside input or dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (auctionId: string) => {
    navigate(`/auction-details/${auctionId}`);
    setShowDropdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDropdown(false);
    navigate(`/explore-auctions/?q=${encodeURIComponent(query)}`);
  };

  const clearQuery = () => {
    setQuery('');
    setResults([]);
    setShowDropdown(false);
    if (inputRef.current) inputRef.current.focus();
  };

  const highlightMatch = (text?: string) => {
    if (!text || !query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={index} className="bg-yellow-200">
          {part}
        </span>
      ) : (
        part
      ),
    );
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          className="w-full px-4 py-2 border rounded-lg pr-8"
          placeholder="Search auctions..."
          value={query}
          onChange={(e) => setupAndSyncSearchQuery(e.target.value)}
          onFocus={() => {
            setShowDropdown(true);
            setIsFocused(true);
          }}
          onBlur={() => setIsFocused(false)}
          ref={inputRef}
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={clearQuery}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-800"
            aria-label="Clear search"
          >
            &#10005;
          </button>
        )}
      </form>

      {showDropdown && results.length > 0 && (
        <div className="absolute top-full z-10 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {results.map((item) => {
            const imgUuid = item.images[0];
            const isLoaded = imageLoadedMap[imgUuid];

            return (
              <div
                key={item.id}
                className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleSelect(item.id)}
              >
                <div className="w-12 h-12 relative mr-4">
                  {!isLoaded && (
                    <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-md" />
                  )}
                  <img
                    src={getImageUrl(imgUuid)}
                    alt={item.title}
                    className={`w-full h-full object-cover rounded-md transition-opacity duration-300 ${
                      isLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={() =>
                      setImageLoadedMap((prev) => ({
                        ...prev,
                        [imgUuid]: true,
                      }))
                    }
                  />
                </div>

                <div className="flex flex-col w-full">
                  <div className="text-sm font-semibold">
                    {highlightMatch(item.title)}
                  </div>

                  <div className="text-xs text-gray-500">
                    Seller:{' '}
                    {highlightMatch(
                      item.seller.firstName && item.seller.lastName
                        ? `${item.seller.firstName} ${item.seller.lastName}`
                        : item.seller.username,
                    )}
                  </div>

                  <div className="text-xs text-gray-400">
                    {highlightMatch(item.category)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
