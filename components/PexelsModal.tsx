
import React, { useState } from 'react';
import { X, Search, Loader2, CheckCircle2 } from 'lucide-react';
import { searchPexelsVideos } from '../services/pexelsService';
import { PexelsVideo } from '../types';
import { PEXELS_API_KEY_STORAGE } from '../constants';

interface PexelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVideos: (videos: PexelsVideo[]) => void;
}

export const PexelsModal: React.FC<PexelsModalProps> = ({ isOpen, onClose, onAddVideos }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PexelsVideo[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<Set<number>>(new Set());
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setError('');
    setSelectedVideos(new Set()); // Reset selection on new search
    
    const apiKey = localStorage.getItem(PEXELS_API_KEY_STORAGE) || '';

    try {
      const data = await searchPexelsVideos(query, apiKey);
      setResults(data.videos);
    } catch (err) {
      setError('Failed to fetch videos. Please add API Key in Sidebar settings.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: number) => {
    const newSet = new Set(selectedVideos);
    if (newSet.has(id)) {
        newSet.delete(id);
    } else {
        newSet.add(id);
    }
    setSelectedVideos(newSet);
  };

  const handleAddSelected = () => {
      const videosToAdd = results.filter(v => selectedVideos.has(v.id));
      onAddVideos(videosToAdd);
      onClose();
      setSelectedVideos(new Set());
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-neutral-900 w-full max-w-4xl max-h-[80vh] rounded-xl border border-neutral-700 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-green-500">Pexels</span> Stock Video
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-neutral-800 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-neutral-900 border-b border-neutral-800 shrink-0">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for 'Ocean', 'City', 'Technology'..."
              className="flex-1 bg-neutral-800 border border-neutral-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button 
              type="submit" 
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition flex items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
              Search
            </button>
          </form>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>

        {/* Results Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-neutral-950">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {results.map((video) => {
              const isSelected = selectedVideos.has(video.id);
              return (
                <div 
                  key={video.id} 
                  className={`group relative aspect-video bg-neutral-800 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${isSelected ? 'border-[#00E5E5]' : 'border-neutral-800 hover:border-green-500'}`}
                  onClick={() => toggleSelection(video.id)}
                >
                  <img src={video.image} alt="Thumbnail" className="w-full h-full object-cover" />
                  
                  {/* Selection Indicator */}
                  <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-[#00E5E5] border-[#00E5E5] text-black' : 'border-white/50 bg-black/30'}`}>
                     {isSelected && <CheckCircle2 size={16} />}
                  </div>

                  <div className="absolute bottom-2 left-2 text-[10px] bg-black/60 px-1.5 py-0.5 rounded text-white font-mono">
                    {video.duration}s
                  </div>
                </div>
              );
            })}
            
            {!loading && results.length === 0 && !error && (
              <div className="col-span-full text-center text-neutral-500 py-12">
                Type a keyword above to find videos.
              </div>
            )}
          </div>
        </div>

        {/* Footer with Add Button */}
        {selectedVideos.size > 0 && (
            <div className="p-4 border-t border-[#333] bg-[#1f1f1f] flex justify-end shrink-0">
                <button 
                    onClick={handleAddSelected}
                    className="bg-[#00E5E5] text-black px-6 py-2 rounded-lg font-bold hover:bg-[#00c4c4] transition-colors"
                >
                    Add {selectedVideos.size} Video{selectedVideos.size !== 1 ? 's' : ''}
                </button>
            </div>
        )}
      </div>
    </div>
  );
};
