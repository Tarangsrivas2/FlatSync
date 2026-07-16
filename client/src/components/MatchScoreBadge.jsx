import { useState, useRef, useEffect } from 'react';
import { matchScoreCache } from '../utils/matchScoreCache';

// ─── Colour helpers ────────────────────────────────────────────────────────────
const getColors = (pct) => {
  if (pct === null) return { stroke: 'var(--color-match-unknown)', ring: 'border-gray-200', bg: 'bg-gray-50', text: 'text-gray-500', badgeCls: 'bg-gray-100 text-gray-600' };
  if (pct >= 71) return { stroke: 'var(--color-match-high)', ring: 'border-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-600', badgeCls: 'bg-emerald-100 text-emerald-700' };
  if (pct >= 41) return { stroke: 'var(--color-match-medium)', ring: 'border-amber-200',   bg: 'bg-amber-50',   text: 'text-amber-600',   badgeCls: 'bg-amber-100  text-amber-700'  };
  return             { stroke: 'var(--color-match-low)', ring: 'border-rose-200',   bg: 'bg-rose-50',   text: 'text-rose-500',   badgeCls: 'bg-rose-100   text-rose-700'   };
};

const getLabel = (pct) => {
  if (pct === null) return 'Unknown';
  if (pct >= 75) return '🎉 Great Match!';
  if (pct >= 50) return '👍 Decent Match';
  return '⚠️ Low Match';
};

// ─── Circular SVG Progress Ring ────────────────────────────────────────────────
const CircularProgress = ({ percentage, animated }) => {
  const size = 88;
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = percentage === null ? circumference : circumference - (percentage / 100) * circumference;
  const colors = getColors(percentage);

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* Track */}
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
        {/* Arc */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: animated ? 'stroke-dashoffset 1s ease-in-out' : 'none' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-lg font-black leading-none ${colors.text}`}>
          {percentage !== null ? `${percentage}%` : '?'}
        </span>
      </div>
    </div>
  );
};

// ─── Skeleton (inline, replaces button during loading) ────────────────────────
const InlineSkeleton = () => (
  <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 animate-pulse">
    <div className="w-[88px] h-[88px] rounded-full bg-gray-200 flex-shrink-0" />
    <div className="flex-1 space-y-2.5">
      <div className="h-3.5 bg-gray-200 rounded-full w-1/2" />
      <div className="h-3 bg-gray-200 rounded-full w-full" />
      <div className="h-3 bg-gray-200 rounded-full w-3/4" />
      <div className="flex gap-2 mt-1">
        <div className="h-5 w-20 bg-gray-200 rounded-full" />
        <div className="h-5 w-16 bg-gray-200 rounded-full" />
        <div className="h-5 w-24 bg-gray-200 rounded-full" />
      </div>
    </div>
  </div>
);

// ─── Score Card ────────────────────────────────────────────────────────────────
const ScoreCard = ({ data, onRecalculate }) => {
  const { matchPercentage, summary, highlights } = data;
  const colors = getColors(matchPercentage);

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-2xl border ${colors.ring} ${colors.bg} transition-all duration-300`}
      style={{ animation: 'fadeSlideIn 0.4s ease-out' }}
    >
      <CircularProgress percentage={matchPercentage} animated />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">AI Match Score</span>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${colors.badgeCls}`}>
            {getLabel(matchPercentage)}
          </span>
        </div>

        <p className="text-sm text-gray-700 leading-snug mb-2">{summary}</p>

        {/* Highlight pills */}
        {highlights && highlights.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {highlights.map((h, i) => (
              <span
                key={i}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/70 border border-gray-200 text-gray-600 backdrop-blur-sm shadow-sm"
              >
                {h}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-1">
          <p className="text-[10px] text-gray-400">Powered by Gemini AI</p>
          <button
            onClick={onRecalculate}
            className="text-[11px] font-semibold text-primary-600 hover:text-primary-700 underline underline-offset-2 transition-colors"
          >
            Recalculate ↺
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
/**
 * @param {string} listingId
 * @param {string} ownerId   — the flat owner's user ID
 * @param {string} viewerId  — the currently logged-in user's ID
 */
const MatchScoreBadge = ({ listingId, ownerId, viewerId }) => {
  const [uiState, setUiState] = useState('idle'); // idle | loading | result | error
  const [resultData, setResultData] = useState(null);
  const esRef = useRef(null); // EventSource ref for cleanup

  // Close any open SSE connection when the component unmounts
  useEffect(() => {
    return () => {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, []);

  const cacheKey = matchScoreCache.key(viewerId, ownerId);

  const handleFetch = () => {
    // Check session cache first
    if (matchScoreCache.has(cacheKey)) {
      setResultData(matchScoreCache.get(cacheKey));
      setUiState('result');
      return;
    }

    setUiState('loading');

    // Close any existing SSE connection
    if (esRef.current) {
      esRef.current.close();
    }

    const token = localStorage.getItem('token');
    const apiBase = import.meta.env.VITE_API_URL || '/api';
    const url = `${apiBase}/match/score/${listingId}?token=${encodeURIComponent(token)}`;

    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (e) => {
      if (e.data === '[DONE]') {
        es.close();
        esRef.current = null;
        return;
      }

      try {
        const payload = JSON.parse(e.data);

        if (payload.type === 'result') {
          const data = {
            matchPercentage: payload.matchPercentage,
            summary: payload.summary,
            highlights: payload.highlights || [],
          };
          matchScoreCache.set(cacheKey, data);
          setResultData(data);
          setUiState('result');
        }

        if (payload.type === 'error') {
          console.error('Match score SSE error:', payload.message);
          setUiState('error');
          es.close();
          esRef.current = null;
        }
        // 'chunk' events are informational — we don't show partial text in this UI
      } catch {
        // Ignore unparseable messages
      }
    };

    es.onerror = () => {
      setUiState('error');
      es.close();
      esRef.current = null;
    };
  };

  const handleRecalculate = () => {
    // Clear this pair from session cache and re-fetch
    matchScoreCache.delete(cacheKey);
    setResultData(null);
    setUiState('idle');
    // Immediately trigger a new fetch
    setTimeout(handleFetch, 0);
  };

  // ── Render ──
  if (uiState === 'idle') {
    return (
      <button
        id="see-match-score-btn"
        onClick={handleFetch}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-primary-300 bg-primary-50 text-primary-700 font-semibold text-sm hover:bg-primary-100 hover:border-primary-400 transition-all duration-200 group"
      >
        <span className="text-base">✨</span>
        See Match Score
        <span className="transition-transform group-hover:translate-x-1">→</span>
      </button>
    );
  }

  if (uiState === 'loading') {
    return <InlineSkeleton />;
  }

  if (uiState === 'error') {
    return (
      <div className="flex items-center justify-between p-4 rounded-2xl border border-rose-200 bg-rose-50">
        <p className="text-sm text-rose-600 font-medium">Could not load match score.</p>
        <button
          onClick={() => { setUiState('idle'); }}
          className="text-xs font-semibold text-rose-600 underline underline-offset-2 ml-3"
        >
          Retry
        </button>
      </div>
    );
  }

  if (uiState === 'result' && resultData) {
    return <ScoreCard data={resultData} onRecalculate={handleRecalculate} />;
  }

  return null;
};

export default MatchScoreBadge;
