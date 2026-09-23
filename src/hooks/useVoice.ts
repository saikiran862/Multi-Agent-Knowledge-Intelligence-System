import { useState, useEffect, useRef, useCallback } from 'react';
import { VoiceState } from '../types';

export function useVoice(onTranscriptFinal?: (text: string) => void) {
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isListening: false,
    isSpeaking: false,
    isPaused: false,
    transcript: '',
    interimTranscript: '',
    error: null,
    isSupported: typeof window !== 'undefined' && (
      'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
    ),
    selectedVoiceName: null,
    playbackRate: 1.0,
    autoSpeak: false,
  });

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const recognitionRef = useRef<any>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize SpeechSynthesis voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      if (voices.length > 0 && !voiceState.selectedVoiceName) {
        // Prefer natural / English voices
        const preferred = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.default)) || voices[0];
        if (preferred) {
          setVoiceState(prev => ({ ...prev, selectedVoiceName: preferred.name }));
        }
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Initialize SpeechRecognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setVoiceState(prev => ({ ...prev, isSupported: false }));
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setVoiceState(prev => ({
          ...prev,
          isListening: true,
          error: null,
          transcript: '',
          interimTranscript: ''
        }));
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        setVoiceState(prev => ({
          ...prev,
          transcript: final || prev.transcript,
          interimTranscript: interim
        }));

        if (final && onTranscriptFinal) {
          onTranscriptFinal(final.trim());
        }
      };

      recognition.onerror = (event: any) => {
        let errMsg = 'Speech recognition error';
        if (event.error === 'not-allowed') {
          errMsg = 'Microphone access was denied or blocked by browser.';
        } else if (event.error === 'no-speech') {
          errMsg = 'No speech detected. Please speak clearly into the microphone.';
        } else if (event.error === 'audio-capture') {
          errMsg = 'No microphone device was detected.';
        } else if (event.error === 'network') {
          errMsg = 'Network communication issue with speech recognition service.';
        }
        setVoiceState(prev => ({
          ...prev,
          isListening: false,
          error: errMsg
        }));
      };

      recognition.onend = () => {
        setVoiceState(prev => ({
          ...prev,
          isListening: false
        }));
      };

      recognitionRef.current = recognition;
    } catch (err: any) {
      console.warn('SpeechRecognition init error:', err);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, [onTranscriptFinal]);

  // Start Voice Input
  const startListening = useCallback(() => {
    // Interrupt ongoing TTS playback immediately
    stopSpeaking();

    if (!recognitionRef.current) {
      // Fallback for simulation mode if browser doesn't support Web Speech in iframe
      setVoiceState(prev => ({
        ...prev,
        error: 'Web Speech API is not supported in this browser frame. You can type queries or test voice simulation.'
      }));
      return;
    }

    try {
      recognitionRef.current.start();
    } catch (err: any) {
      // If already started, restart
      try {
        recognitionRef.current.stop();
        setTimeout(() => {
          recognitionRef.current.start();
        }, 150);
      } catch (e: any) {
        setVoiceState(prev => ({ ...prev, error: e?.message || 'Could not start voice recognition' }));
      }
    }
  }, []);

  // Stop Voice Input
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setVoiceState(prev => ({ ...prev, isListening: false }));
  }, []);

  // Text-to-Speech (Speak response)
  const speakText = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setVoiceState(prev => ({ ...prev, error: 'Speech synthesis is not supported on this device.' }));
      return;
    }

    // Stop existing speech
    window.speechSynthesis.cancel();

    // Remove citation brackets like [1], [2], [Doc 1, §3.2] for cleaner vocal delivery
    const cleanText = text
      .replace(/\[\d+\]/g, '')
      .replace(/\[Doc \d+[^\]]*\]/g, '')
      .replace(/\*+/g, '')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = voiceState.playbackRate;

    if (voiceState.selectedVoiceName && availableVoices.length > 0) {
      const selected = availableVoices.find(v => v.name === voiceState.selectedVoiceName);
      if (selected) utterance.voice = selected;
    }

    utterance.onstart = () => {
      setVoiceState(prev => ({ ...prev, isSpeaking: true, isPaused: false }));
    };

    utterance.onend = () => {
      setVoiceState(prev => ({ ...prev, isSpeaking: false, isPaused: false }));
      currentUtteranceRef.current = null;
    };

    utterance.onerror = (e) => {
      console.warn('TTS error:', e);
      setVoiceState(prev => ({ ...prev, isSpeaking: false, isPaused: false }));
      currentUtteranceRef.current = null;
    };

    currentUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [voiceState.playbackRate, voiceState.selectedVoiceName, availableVoices]);

  // Pause Speech
  const pauseSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setVoiceState(prev => ({ ...prev, isPaused: true }));
    }
  }, []);

  // Resume Speech
  const resumeSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
      setVoiceState(prev => ({ ...prev, isPaused: false }));
    }
  }, []);

  // Stop Speech
  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setVoiceState(prev => ({ ...prev, isSpeaking: false, isPaused: false }));
      currentUtteranceRef.current = null;
    }
  }, []);

  // Set Voice
  const setVoice = useCallback((name: string) => {
    setVoiceState(prev => ({ ...prev, selectedVoiceName: name }));
  }, []);

  // Set Rate
  const setPlaybackRate = useCallback((rate: number) => {
    setVoiceState(prev => ({ ...prev, playbackRate: rate }));
  }, []);

  // Toggle Auto-speak
  const toggleAutoSpeak = useCallback(() => {
    setVoiceState(prev => ({ ...prev, autoSpeak: !prev.autoSpeak }));
  }, []);

  // Clear Error
  const clearError = useCallback(() => {
    setVoiceState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    voiceState,
    availableVoices,
    startListening,
    stopListening,
    speakText,
    pauseSpeaking,
    resumeSpeaking,
    stopSpeaking,
    setVoice,
    setPlaybackRate,
    toggleAutoSpeak,
    clearError
  };
}
