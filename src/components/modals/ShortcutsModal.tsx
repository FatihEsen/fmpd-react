import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Oynat / Duraklat' },
    { key: 'B', desc: 'Önceki Parça' },
    { key: 'N', desc: 'Sonraki Parça' },
    { key: 'z', desc: 'Rastgele Çalma Modu (Shuffle)' },
    { key: 'r', desc: 'Tekrar Modu (Repeat)' },
    { key: 'y', desc: 'Tek Şarkı Modu (Single)' },
    { key: 'x', desc: 'Tüketim Modu (Consume - çalınanı sil)' },
    { key: 'j / k', desc: 'Listede Aşağı / Yukarı Gezinme' },
    { key: 'Shift + J', desc: 'Seçilen Parçaları Aşağı Taşı' },
    { key: 'Shift + K', desc: 'Seçilen Parçaları Yukarı Taşı' },
    { key: 'ö / ]', desc: 'Seçilen Parçayı Sıradaki Yap (Queue Next)' },
    { key: 'd / Del', desc: 'Seçilen Parçaları Kuyruktan Sil' },
    { key: 'c', desc: 'Kuyruğu Temizle' },
    { key: '/', desc: 'Arama Kutusuna Odaklan' },
    { key: '?', desc: 'Bu Kısayollar Penceresini Aç' },
    { key: 'Esc', desc: 'Pencereleri veya Aramayı Kapat' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#11111b]/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#1e1e2e] border border-[#313244] rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-[#313244] pb-3">
          <div className="flex items-center gap-2 text-[#cdd6f4]">
            <Keyboard className="w-5 h-5 text-[#fab387]" />
            <h3 className="font-bold text-lg">ncmpcpp & FMPD Klavye Kısayolları</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#313244] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {shortcuts.map((sc) => (
            <div
              key={sc.key}
              className="flex items-center justify-between p-2 rounded-xl bg-[#181825] border border-[#313244]/80 text-xs"
            >
              <kbd className="font-mono font-bold bg-[#313244] text-[#fab387] px-2 py-1 rounded-md border border-[#45475a]/60 shadow-xs">
                {sc.key}
              </kbd>
              <span className="text-[#cdd6f4] font-medium text-right">{sc.desc}</span>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-[#313244] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#313244] hover:bg-[#45475a] text-sm font-semibold text-[#cdd6f4] transition-all"
          >
            Tamam (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
