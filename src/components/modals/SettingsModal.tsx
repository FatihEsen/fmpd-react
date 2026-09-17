import React, { useState } from 'react';
import { X, Settings, Server, Sparkles, Check, Info } from 'lucide-react';
import { MpdConfig } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: MpdConfig;
  onSaveConfig: (newConfig: MpdConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [host, setHost] = useState(config.host);
  const [port, setPort] = useState(config.port.toString());
  const [password, setPassword] = useState(config.password || '');
  const [wsUrl, setWsUrl] = useState(config.wsUrl || 'ws://localhost:8080/ws');
  const [isDemoMode, setIsDemoMode] = useState(config.isDemoMode);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      host: host.trim() || 'localhost',
      port: parseInt(port, 10) || 6600,
      password: password.trim(),
      wsUrl: wsUrl.trim(),
      isDemoMode,
      connected: !isDemoMode,
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#11111b]/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#1e1e2e] border border-[#313244] rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-[#313244] pb-3">
          <div className="flex items-center gap-2 text-[#cdd6f4]">
            <Settings className="w-5 h-5 text-[#fab387]" />
            <h3 className="font-bold text-lg">Ayarlar & MPD Sunucu Bağlantısı</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#313244] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {saved ? (
          <div className="py-8 text-center flex flex-col items-center gap-2 text-[#a6e3a1]">
            <Check className="w-8 h-8" />
            <p className="font-bold text-base">Ayarlar Başarıyla Kaydedildi!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Mode selection toggle */}
            <div className="bg-[#181825] p-3 rounded-xl border border-[#313244] flex flex-col gap-2">
              <span className="text-xs font-semibold text-[#a6adc8]">Çalışma Modu</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsDemoMode(true)}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-lg text-xs font-bold transition-all ${
                    isDemoMode
                      ? 'bg-[#fab387] text-[#11111b] shadow-sm'
                      : 'bg-[#313244] text-[#a6adc8] hover:text-[#cdd6f4]'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Simülasyon (Demo)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsDemoMode(false)}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-lg text-xs font-bold transition-all ${
                    !isDemoMode
                      ? 'bg-[#fab387] text-[#11111b] shadow-sm'
                      : 'bg-[#313244] text-[#a6adc8] hover:text-[#cdd6f4]'
                  }`}
                >
                  <Server className="w-4 h-4" />
                  <span>Canlı MPD Sunucusu</span>
                </button>
              </div>
              <p className="text-[11px] text-[#6c7086] mt-1">
                {isDemoMode
                  ? 'Ghibli albümleri ve parçalarıyla arayüzü tam işlevsellikle test edebilirsiniz.'
                  : 'Kendi yerel veya uzaktaki Music Player Daemon (MPD) sunucunuza bağlanır.'}
              </p>
            </div>

            {/* Server details */}
            <div className={`flex flex-col gap-3 transition-opacity ${isDemoMode ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-[#a6adc8] mb-1">
                    MPD Sunucu Adresi (Host)
                  </label>
                  <input
                    type="text"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    placeholder="localhost veya IP"
                    className="w-full bg-[#181825] text-[#cdd6f4] text-sm px-3 py-2 rounded-xl border border-[#313244] focus:outline-none focus:border-[#fab387]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#a6adc8] mb-1">
                    Port
                  </label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    placeholder="6600"
                    className="w-full bg-[#181825] text-[#cdd6f4] text-sm px-3 py-2 rounded-xl border border-[#313244] focus:outline-none focus:border-[#fab387]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#a6adc8] mb-1">
                  MPD Parolası (Opsiyonel)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Şifre tanımlıysa girin"
                  className="w-full bg-[#181825] text-[#cdd6f4] text-sm px-3 py-2 rounded-xl border border-[#313244] focus:outline-none focus:border-[#fab387]"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-[#11111b] border border-[#313244] text-[11px] text-[#a6adc8] flex flex-col gap-1">
                <span className="text-[#fab387] font-bold">⚡ Dahili Express & WebSocket Köprüsü Aktif</span>
                <span>
                  Sunucu tarafında entegre edilen TCP köprüsü doğrudan MPD soketinizle (<code className="text-[#89b4fa]">host:port</code>) iletişim kurar. Yerel ortamınızda veya tünelle bağlandığınızda MPD komutları anlık iletilir.
                </span>
              </div>
            </div>

            {/* About note */}
            <div className="p-2.5 rounded-xl bg-[#181825]/50 border border-[#313244] flex items-start gap-2 text-xs text-[#a6adc8]">
              <Info className="w-4 h-4 text-[#89b4fa] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#cdd6f4]">FMPD React Modernizasyonu:</strong>
                <p className="text-[11px] text-[#6c7086] mt-0.5">
                  Catppuccin Mocha renk paleti ve Studio Ghibli teması React 19 ve Tailwind altyapısına başarıyla dönüştürüldü.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-[#313244] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#313244] hover:bg-[#45475a] text-sm font-semibold text-[#cdd6f4] transition-all"
              >
                Kapat
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#fab387] hover:bg-[#f9e2af] text-sm font-semibold text-[#11111b] transition-all shadow-md active:scale-95"
              >
                Kaydet
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
