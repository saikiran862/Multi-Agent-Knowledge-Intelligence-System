import React, { useState } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Pause, 
  Play, 
  Square, 
  Settings, 
  AlertCircle, 
  Check, 
  X, 
  Radio, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { VoiceState } from '../types';

interface VoiceControlsProps {
  voiceState: VoiceState;
  availableVoices: SpeechSynthesisVoice[];
  onStartListening: () => void;
  onStopListening: () => void;
  onSpeak: (text: string) => void;
  onPauseSpeech: () => void;
  onResumeSpeech: () => void;
  onStopSpeech: () => void;
  onSetVoice: (name: string) => void;
  onSetPlaybackRate: (rate: number) => void;
  onToggleAutoSpeak: () => void;
  onClearError: () => void;
  onSendTranscript: (text: string) => void;
  currentResponseText?: string;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  voiceState,
  availableVoices,
  onStartListening,
  onStopListening,
  onSpeak,
  onPauseSpeech,
  onResumeSpeech,
  onStopSpeech,
  onSetVoice,
  onSetPlaybackRate,
  onToggleAutoSpeak,
  onClearError,
  onSendTranscript,
  currentResponseText
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [simulatedVoiceOpen, setSimulatedVoiceOpen] = useState(false);

  const {
    isListening,
    isSpeaking,
    isPaused,
    transcript,
    interimTranscript,
    error,
    isSupported,
    selectedVoiceName,
    playbackRate,
    autoSpeak
  } = voiceState;

  const currentTranscript = transcript || interimTranscript;

  const handleSimulateVoice = (phrase: string) => {
    onSendTranscript(phrase);
    setSimulatedVoiceOpen(false);
  };

  return (
    <div id="voice-interaction-module" className="relative">
      {/* Primary Voice Bar Controls */}
      <div className="flex items-center gap-1.5">
        {/* Microphone Button */}
        <button
          id="mic-toggle-button"
          type="button"
          onClick={isListening ? onStopListening : onStartListening}
          title={isListening ? 'Stop listening' : 'Start voice input (Web Speech API)'}
          className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-all shadow-xs ${
            isListening
              ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-200'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
          }`}
        >
          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {isListening && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
          )}
        </button>

        {/* TTS Playback Controls if current response is available */}
        {currentResponseText && (
          <div className="flex items-center gap-1 border-l border-slate-200 pl-1.5">
            {!isSpeaking ? (
              <button
                id="tts-play-button"
                type="button"
                onClick={() => onSpeak(currentResponseText)}
                title="Read response aloud (Text-to-Speech)"
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-indigo-600 transition-colors"
              >
                <Volume2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Read Aloud</span>
              </button>
            ) : (
              <div className="flex items-center gap-1">
                {isPaused ? (
                  <button
                    id="tts-resume-button"
                    type="button"
                    onClick={onResumeSpeech}
                    title="Resume speech"
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                  </button>
                ) : (
                  <button
                    id="tts-pause-button"
                    type="button"
                    onClick={onPauseSpeech}
                    title="Pause speech"
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100"
                  >
                    <Pause className="h-3.5 w-3.5 fill-current" />
                  </button>
                )}
                <button
                  id="tts-stop-button"
                  type="button"
                  onClick={onStopSpeech}
                  title="Stop speech"
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100"
                >
                  <Square className="h-3 w-3 fill-current" />
                </button>

                {/* Animated Speech Wave */}
                <div className="flex items-center gap-0.5 px-1">
                  <span className="h-3 w-0.5 bg-indigo-500 animate-pulse" />
                  <span className="h-4 w-0.5 bg-indigo-600 animate-pulse [animation-delay:150ms]" />
                  <span className="h-2 w-0.5 bg-indigo-400 animate-pulse [animation-delay:300ms]" />
                  <span className="h-3.5 w-0.5 bg-indigo-500 animate-pulse [animation-delay:75ms]" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Voice Settings Popover Trigger */}
        <button
          id="voice-settings-toggle"
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          title="Voice & Speech Settings"
          className={`flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 transition-colors shadow-xs ${
            showSettings ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {/* Real-Time Speech Transcription Overlay */}
      {isListening && (
        <div 
          id="listening-transcription-preview"
          className="absolute bottom-full mb-3 left-0 right-0 z-30 rounded-xl border border-indigo-200 bg-white p-3.5 shadow-lg animate-in fade-in slide-in-from-bottom-2"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <span className="text-xs font-semibold text-slate-800">
                Listening... Speak query now
              </span>
            </div>
            <button
              onClick={onStopListening}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="min-h-[44px] rounded-lg bg-slate-50 p-2.5 text-xs text-slate-800 border border-slate-200">
            {currentTranscript ? (
              <span>
                <strong className="text-slate-900">{transcript}</strong>
                <span className="text-indigo-600 italic"> {interimTranscript}</span>
              </span>
            ) : (
              <span className="text-slate-400 italic">"Say: What are the RTO requirements for tier-1 databases?..."</span>
            )}
          </div>

          <div className="mt-2.5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onStopListening}
              className="rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            {currentTranscript && (
              <button
                id="send-voice-transcript-button"
                type="button"
                onClick={() => {
                  onStopListening();
                  onSendTranscript(currentTranscript.trim());
                }}
                className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Submit Query</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Voice Settings Modal / Popover */}
      {showSettings && (
        <div 
          id="voice-settings-popover"
          className="absolute bottom-full mb-3 right-0 z-40 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-xl text-xs"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Settings className="h-3.5 w-3.5 text-indigo-600" />
              <span>Voice & Speech Module Settings</span>
            </h4>
            <button 
              onClick={() => setShowSettings(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Auto-Speak Toggle */}
          <div className="flex items-center justify-between py-1.5">
            <div>
              <span className="font-semibold text-slate-700 block">Auto-Read Responses</span>
              <span className="text-[10px] text-slate-400">Play audio immediately after answer generation</span>
            </div>
            <button
              id="auto-speak-toggle"
              type="button"
              onClick={onToggleAutoSpeak}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autoSpeak ? 'bg-indigo-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  autoSpeak ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Playback Rate Slider */}
          <div className="mt-3 border-t border-slate-100 pt-2.5">
            <div className="flex justify-between text-slate-700 font-semibold mb-1">
              <span>Speech Rate:</span>
              <span className="font-mono text-indigo-600">{playbackRate}x</span>
            </div>
            <input
              id="speech-rate-slider"
              type="range"
              min="0.75"
              max="1.5"
              step="0.25"
              value={playbackRate}
              onChange={(e) => onSetPlaybackRate(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>0.75x</span>
              <span>1.0x</span>
              <span>1.5x</span>
            </div>
          </div>

          {/* Voice Picker */}
          {availableVoices.length > 0 && (
            <div className="mt-3 border-t border-slate-100 pt-2.5">
              <label className="block font-semibold text-slate-700 mb-1">
                Voice Selection:
              </label>
              <select
                id="voice-select-dropdown"
                value={selectedVoiceName || ''}
                onChange={(e) => onSetVoice(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white p-1.5 text-xs text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-none"
              >
                {availableVoices
                  .filter(v => v.lang.startsWith('en'))
                  .slice(0, 10)
                  .map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Simulation Fallback Button */}
          <div className="mt-3 border-t border-slate-100 pt-2.5">
            <button
              id="open-simulated-voice-button"
              type="button"
              onClick={() => {
                setShowSettings(false);
                setSimulatedVoiceOpen(true);
              }}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              <span>Speech Diagnostics / Voice Test Preset</span>
            </button>
          </div>
        </div>
      )}

      {/* Simulated Voice Diagnostic Dialog */}
      {simulatedVoiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Voice Input Simulation & Testing Hub
                </h3>
              </div>
              <button 
                onClick={() => setSimulatedVoiceOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-2 text-xs text-slate-600">
              Select a pre-transcribed vocal utterance below to test speech input through the multi-agent pipeline immediately:
            </p>

            <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
              {[
                'What are the RTO requirements for tier-1 databases?',
                'What is the policy on data retention?',
                'Tell me about compliance',
                'How often must we rotate KMS customer keys?',
                'What are the cash reporting thresholds for SAR and CTR?'
              ].map((phrase, i) => (
                <button
                  key={i}
                  onClick={() => handleSimulateVoice(phrase)}
                  className="w-full text-left rounded-lg border border-slate-200 p-2.5 text-xs text-slate-800 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-900 transition-colors flex items-center justify-between group"
                >
                  <span className="font-medium">"{phrase}"</span>
                  <Play className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-600" />
                </button>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setSimulatedVoiceOpen(false)}
                className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voice Error Notice */}
      {error && (
        <div 
          id="voice-error-banner"
          className="absolute bottom-full mb-3 left-0 z-30 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800 shadow-md max-w-sm"
        >
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block">Voice Notice:</span>
            <span>{error}</span>
          </div>
          <button 
            onClick={onClearError}
            className="text-rose-500 hover:text-rose-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
