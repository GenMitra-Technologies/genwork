// src/features/courses/components/YouTubePlayer.tsx
import React, { useState } from 'react';
import { getYouTubeEmbedUrl } from '../../../lib/youtube';
import { AlertCircle, Play } from 'lucide-react';

interface YouTubePlayerProps {
  videoId: string;
  title?: string;
  thumbnailUrl?: string;
}

export function YouTubePlayer({ videoId, title, thumbnailUrl }: YouTubePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const embedUrl = getYouTubeEmbedUrl(videoId);

  if (!videoId) {
    return (
      <div className="w-full aspect-video rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-6 text-slate-400">
        <AlertCircle className="h-8 w-8 text-amber-500 mb-2" />
        <p className="text-sm font-medium">No valid YouTube video ID specified.</p>
        <p className="text-xs text-slate-500 mt-1">Please provide a valid YouTube URL in course modules.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80 shadow-md">
      {!isPlaying && thumbnailUrl ? (
        <div className="relative w-full h-full cursor-pointer group" onClick={() => setIsPlaying(true)}>
          <img
            src={thumbnailUrl}
            alt={title || 'Course video thumbnail'}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] transition-colors group-hover:bg-slate-950/20 flex items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-red-600 group-hover:bg-red-700 text-white shadow-xl flex items-center justify-center transition-transform group-hover:scale-110">
              <Play className="h-7 w-7 ml-1 fill-white" />
            </div>
          </div>
          {title && (
            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent">
              <p className="text-sm font-medium text-white line-clamp-1">{title}</p>
              <p className="text-[11px] text-slate-300">Click to start video</p>
            </div>
          )}
        </div>
      ) : (
        <iframe
          src={`${embedUrl}${isPlaying ? '&autoplay=1' : ''}`}
          title={title || 'YouTube Course Video Player'}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      )}
    </div>
  );
}
