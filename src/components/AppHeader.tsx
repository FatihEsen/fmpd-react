import React from 'react';
import { TabType, MpdConfig } from '../types';
import { 
  Radio, 
  FolderTree, 
  HelpCircle, 
  RefreshCw, 
  Settings, 
  Search, 
  Wifi, 
  WifiOff 
} from 'lucide-react';

interface AppHeaderProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenShortcuts: () => void;
  onOpenSettings: () => void;
  onUpdateDb: () => void;
  isUpdatingDb: boolean;
  config: MpdConfig;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  onOpenShortcuts,
  onOpenSettings,
  onUpdateDb,
  isUpdatingDb,
  config,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#181825]/90 backdrop-blur-md border-b border-[#313244] px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Brand & Navigation */}
        <div className="flex items-center gap-4 sm:gap-6 w-full md:w-auto justify-between md:justify-start">
          <div
            className="flex items-center select-none cursor-pointer"
            onClick={() => onTabChange('queue')}
            title="FMPD"
          >
            <span className="inline-flex items-center gap-1.5 text-sm sm:text-base px-2.5 py-1 rounded-xl font-bold bg-[#fab387]/15 text-[#fab387] border border-[#fab387]/30 hover:bg-[#fab387]/25 transition-all shadow-sm">
              <span className="text-base leading-none">🌱</span>
              <span className="tracking-wider font-extrabold text-[#fab387]">FMPD</span>
            </span>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-[#1e1e2e] p-1 rounded-xl border border-[#313244]">
            <button
              id="tab-queue"
              type="button"
              onClick={() => onTabChange('queue')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                currentTab === 'queue'
                  ? 'bg-[#cba6f7] text-[#11111b] shadow-sm'
                  : 'text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#313244]/50'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>Sıra</span>
            </button>

            <button
              id="tab-library"
              type="button"
              onClick={() => onTabChange('library')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                currentTab === 'library'
                  ? 'bg-[#cba6f7] text-[#11111b] shadow-sm'
                  : 'text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#313244]/50'
              }`}
            >
              <FolderTree className="w-4 h-4" />
              <span>Kütüphane</span>
            </button>
          </nav>
        </div>

        {/* Center: Search input */}
        <div className="w-full md:max-w-md relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a6adc8]" />
          <input
            id="main-search-input"
            type="text"
            placeholder="Şarkı, sanatçı veya albüm ara... (/)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#1e1e2e] text-[#cdd6f4] placeholder-[#6c7086] text-sm pl-9 pr-16 py-2 rounded-xl border border-[#313244] focus:outline-none focus:border-[#fab387] focus:ring-1 focus:ring-[#fab387] transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-8 top-1/2 -translate-y-1/2 text-xs text-[#a6adc8] hover:text-[#cdd6f4] px-1"
            >
              ✕
            </button>
          )}
          <span className="hidden sm:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#6c7086] bg-[#313244] px-1.5 py-0.5 rounded font-mono">
            /
          </span>
        </div>

        {/* Right: Actions and Status */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {/* Status Badge */}
          <div
            onClick={onOpenSettings}
            title={config.connected ? 'MPD Sunucusuna Bağlı' : 'MPD Bağlantısı Kesik (Ayarları Aç)'}
            className="hidden lg:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-[#313244] bg-[#1e1e2e] cursor-pointer hover:border-[#45475a] transition-all"
          >
            {config.connected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-[#a6e3a1]" />
                <span className="text-[#a6e3a1] font-mono">{config.host}:{config.port}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-[#f38ba8]" />
                <span className="text-[#f38ba8] font-mono">{config.host}:{config.port} (Bağlantı Yok)</span>
              </>
            )}
          </div>

          <button
            id="btn-shortcuts"
            type="button"
            onClick={onOpenShortcuts}
            title="Klavye Kısayolları (?)"
            aria-label="Klavye Kısayolları"
            className="p-2 rounded-xl text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#313244] border border-transparent hover:border-[#45475a] transition-all"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            id="btn-update-db"
            type="button"
            onClick={onUpdateDb}
            title="Veritabanını Güncelle"
            aria-label="Veritabanını Güncelle"
            className={`p-2 rounded-xl text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#313244] border border-transparent hover:border-[#45475a] transition-all ${
              isUpdatingDb ? 'animate-spin text-[#fab387]' : ''
            }`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            id="btn-settings"
            type="button"
            onClick={onOpenSettings}
            title="Ayarlar & MPD Bağlantısı"
            aria-label="Ayarlar"
            className="p-2 rounded-xl text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#313244] border border-transparent hover:border-[#45475a] transition-all"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
