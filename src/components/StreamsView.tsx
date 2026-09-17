import React from 'react';
import { StreamItem, Song } from '../types';
import { Radio, Play, Plus, Trash2, ExternalLink } from 'lucide-react';

interface StreamsViewProps {
  streams: StreamItem[];
  onPlayStream: (stream: StreamItem) => void;
  onAddStreamToQueue: (stream: StreamItem) => void;
  onRemoveStream: (id: string) => void;
  onOpenAddModal: () => void;
}

export const StreamsView: React.FC<StreamsViewProps> = ({
  streams,
  onPlayStream,
  onAddStreamToQueue,
  onRemoveStream,
  onOpenAddModal,
}) => {
  return (
    <section className="bg-[#1e1e2e]/90 backdrop-blur-md rounded-2xl border border-[#313244] overflow-hidden shadow-xl flex flex-col">
      {/* Header */}
      <div className="px-4 py-3.5 sm:px-6 border-b border-[#313244] flex items-center justify-between gap-3 bg-[#181825]/50">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-[#fab387]" />
          <h3 className="text-base sm:text-lg font-bold text-[#cdd6f4]">
            İnternet Radyoları & Canlı Akışlar
          </h3>
        </div>

        <button
          type="button"
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#fab387] hover:bg-[#f9e2af] text-[#11111b] text-xs font-semibold shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Yeni Akış Ekle</span>
        </button>
      </div>

      {/* Streams Grid */}
      <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {streams.map((stream) => (
          <div
            key={stream.id}
            className="p-4 rounded-xl bg-[#181825] border border-[#313244] hover:border-[#fab387]/40 flex flex-col justify-between gap-3 group transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#313244] flex items-center justify-center text-xl shrink-0">
                {stream.icon || '📻'}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-[#cdd6f4] group-hover:text-[#fab387] truncate transition-colors">
                  {stream.name}
                </h4>
                <p className="text-xs text-[#a6adc8] truncate mt-0.5">
                  {stream.genre || 'Canlı Yayın'}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-[#6c7086]">
                  {stream.bitrate && (
                    <span className="bg-[#313244] px-1.5 py-0.5 rounded text-[#a6e3a1]">
                      {stream.bitrate}
                    </span>
                  )}
                  <span className="truncate max-w-[180px]">{stream.url}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#313244]/60">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onPlayStream(stream)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#fab387] text-[#11111b] hover:bg-[#f9e2af] text-xs font-semibold transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Dinle</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAddStreamToQueue(stream)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#313244] text-[#cdd6f4] hover:bg-[#45475a] text-xs font-semibold transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Sıraya Ekle</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => onRemoveStream(stream.id)}
                title="Akışı Sil"
                className="p-1.5 rounded-lg text-[#6c7086] hover:text-[#f38ba8] hover:bg-[#313244] transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
