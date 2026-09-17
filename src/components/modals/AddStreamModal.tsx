import React, { useState } from 'react';
import { X, Radio, Plus } from 'lucide-react';
import { StreamItem } from '../../types';

interface AddStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStream: (stream: StreamItem) => void;
}

export const AddStreamModal: React.FC<AddStreamModalProps> = ({
  isOpen,
  onClose,
  onAddStream,
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [genre, setGenre] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    onAddStream({
      id: `stream-custom-${Date.now()}`,
      name: name.trim(),
      url: url.trim(),
      genre: genre.trim() || 'Radyo Akışı',
      icon: '🌊',
    });

    setName('');
    setUrl('');
    setGenre('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#11111b]/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#1e1e2e] border border-[#313244] rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-[#313244] pb-3">
          <div className="flex items-center gap-2 text-[#cdd6f4]">
            <Radio className="w-5 h-5 text-[#fab387]" />
            <h3 className="font-bold text-lg">İnternet Radyosu / Akış Ekle</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#313244] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#a6adc8] mb-1">
              Akış / İstasyon Adı *
            </label>
            <input
              type="text"
              required
              placeholder="Örn: Ghibli Piano Radio"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#181825] text-[#cdd6f4] placeholder-[#6c7086] text-sm px-3 py-2 rounded-xl border border-[#313244] focus:outline-none focus:border-[#fab387]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#a6adc8] mb-1">
              Akış URL Bağlantısı (HTTP / HTTPS / M3U) *
            </label>
            <input
              type="url"
              required
              placeholder="http://example.com/stream.mp3"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-[#181825] text-[#cdd6f4] placeholder-[#6c7086] text-sm px-3 py-2 rounded-xl border border-[#313244] focus:outline-none focus:border-[#fab387]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#a6adc8] mb-1">
              Tür / Kategori
            </label>
            <input
              type="text"
              placeholder="Örn: Klasik, Jazz, Lo-Fi"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full bg-[#181825] text-[#cdd6f4] placeholder-[#6c7086] text-sm px-3 py-2 rounded-xl border border-[#313244] focus:outline-none focus:border-[#fab387]"
            />
          </div>

          <div className="pt-3 border-t border-[#313244] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#313244] hover:bg-[#45475a] text-sm font-semibold text-[#cdd6f4] transition-all"
            >
              İptal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#fab387] hover:bg-[#f9e2af] text-sm font-semibold text-[#11111b] transition-all shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Akışı Ekle</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
