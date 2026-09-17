import React, { useState } from 'react';
import { X, Save, Check } from 'lucide-react';

interface SavePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  songCount: number;
}

export const SavePlaylistModal: React.FC<SavePlaylistModalProps> = ({
  isOpen,
  onClose,
  onSave,
  songCount,
}) => {
  const [name, setName] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave(name.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setName('');
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#11111b]/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#1e1e2e] border border-[#313244] rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-[#313244] pb-3">
          <div className="flex items-center gap-2 text-[#cdd6f4]">
            <Save className="w-5 h-5 text-[#fab387]" />
            <h3 className="font-bold text-lg">Çalma Listesini Kaydet</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#313244] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedSuccess ? (
          <div className="py-8 text-center flex flex-col items-center gap-2 text-[#a6e3a1]">
            <Check className="w-8 h-8" />
            <p className="font-bold text-base">Çalma Listesi Kaydedildi!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <p className="text-xs text-[#a6adc8]">
              Şu anki çalma sırasındaki <strong>{songCount}</strong> parçayı MPD çalma listesi olarak kaydedin.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#a6adc8] mb-1">
                Çalma Listesi Adı *
              </label>
              <input
                type="text"
                required
                placeholder="Örn: Ghibli Dinlenme Listesi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
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
                <Save className="w-4 h-4" />
                <span>Kaydet</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
