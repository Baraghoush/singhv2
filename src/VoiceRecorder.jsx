import React, { useEffect, useRef, useState } from 'react';
import emailjs from '@emailjs/browser';
import { supabase, updateContacts } from './supabaseClient';

// Placeholder config. Replace with your actual config or import from a config file.
const config = {
  EMAILJS: { publicKey: '8ebA--sjSPqBP4A9N' },
  GOOGLE_TRANSLATE_API_KEY: 'AIzaSyAwukDluAwraIwtjf4A-XOlZAsdUBilL5M',
};

const VoiceRecorder = () => {
  // State variables
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState('en-US');
  const [micDevices, setMicDevices] = useState([]);
  const [selectedMic, setSelectedMic] = useState('');
  const [micStatus, setMicStatus] = useState({ status: 'checking', details: '' });
  const [micTestStatus, setMicTestStatus] = useState('');
  const [micLevel, setMicLevel] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingIndicator, setRecordingIndicator] = useState(false);
  const [voiceInput, setVoiceInput] = useState('');
  const [permissionStatus, setPermissionStatus] = useState('');
  const [showTranslate, setShowTranslate] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  // Refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  const animationFrameRef = useRef(null);
  const recognitionRef = useRef(null);

  // EmailJS init
  useEffect(() => {
    if (config.EMAILJS.publicKey) {
      emailjs.init(config.EMAILJS.publicKey);
    }
  }, []);

  // Load microphone devices
  useEffect(() => {
    async function loadMicrophoneDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioDevices = devices.filter(device => device.kind === 'audioinput');
        setMicDevices(audioDevices);
        setMicStatus({ status: audioDevices.length > 0 ? 'available' : 'unavailable', details: `${audioDevices.length} microphone(s) found` });
      } catch (error) {
        setMicStatus({ status: 'error', details: error.message });
      }
    }
    loadMicrophoneDevices();
  }, []);

  // Speech recognition setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;
      recognition.onresult = async (event) => {
        const transcript = Array.from(event.results).map(result => result[0].transcript).join('');
        let finalInput = transcript;
        if (language !== 'en-US') {
          const translatedText = await translateText(transcript);
          finalInput = `${transcript}\n\nTranslated to English:\n${translatedText}`;
        }
        setVoiceInput(finalInput);
        // Save to Supabase when transcribed and email is present
        if (email) {
          await saveVoiceInputToSupabase(email, finalInput);
        }
      };
      recognition.onerror = (event) => {
        setMicStatus({ status: 'error', details: `Speech recognition error: ${event.error}` });
      };
      recognition.onend = () => {
        if (isRecording) recognition.start();
      };
      recognitionRef.current = recognition;
    } else {
      setMicStatus({ status: 'error', details: 'Speech recognition not supported in this browser' });
    }
    // eslint-disable-next-line
  }, [language, isRecording, email]);

  // Microphone test
  const initializeAudio = async () => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      microphoneRef.current.connect(analyserRef.current);
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      function updateLevel() {
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const level = (average / 255) * 100;
        setMicLevel(level);
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      }
      updateLevel();
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleTestMic = async () => {
    setMicTestStatus('Testing microphone...');
    const success = await initializeAudio();
    if (success) {
      setMicTestStatus('Microphone test successful!');
      setMicStatus({ status: 'available', details: 'Microphone is working properly' });
    } else {
      setMicTestStatus('Microphone test failed');
      setMicStatus({ status: 'error', details: 'Could not initialize microphone' });
    }
  };

  // Recording logic
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new window.MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingIndicator(true);
      if (recognitionRef.current) recognitionRef.current.start();
      setMicStatus({ status: 'available', details: 'Recording in progress' });
    } catch (error) {
      setMicStatus({ status: 'error', details: error.message });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingIndicator(false);
      if (recognitionRef.current) recognitionRef.current.stop();
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        // Send email with recording
        if (email) {
          await sendEmailToAndy(voiceInput, email);
        }
        setMicStatus({ status: 'available', details: 'Recording completed' });
      };
    }
  };

  // Email sending logic
  const sendEmailToAndy = async (voiceInput, email) => {
    try {
      const templateParams = {
        to_email: 'andybaronca@gmail.com',
        from_name: 'Family Law Assistant',
        question: `Voice Recording from ${email}`,
        answer: voiceInput,
        timestamp: new Date().toLocaleString(),
      };
      await emailjs.send('service_v3epzv2', 'template_fuz4031', templateParams);
      return true;
    } catch (error) {
      return false;
    }
  };

  // Translation logic
  const translateText = async (text, targetLang = 'en') => {
    try {
      const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${config.GOOGLE_TRANSLATE_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, target: targetLang }),
      });
      if (!response.ok) throw new Error(`Translation failed: ${response.statusText}`);
      const data = await response.json();
      return data.data.translations[0].translatedText;
    } catch (error) {
      return text;
    }
  };

  // Show translate button if text is entered
  useEffect(() => {
    setShowTranslate(!!voiceInput);
  }, [voiceInput]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  // Add this helper function inside the component
  const saveVoiceInputToSupabase = async (email, voiceInput) => {
    try {
      // Insert directly into contacts table with email and voiceInput
      const { data, error } = await supabase
        .from('contacts')
        .insert([{ 
          email: email, 
          voiceInput: voiceInput,
          created_at: new Date().toISOString()
        }])
        .select('id')
        .single();

      if (error) {
        console.error('Error inserting into contacts:', error);
        return null;
      }
      
      console.log('Successfully inserted into contacts:', data);
      return data;
    } catch (error) {
      console.error('Error in saveVoiceInputToSupabase:', error);
      return null;
    }
  };

  // UI rendering
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="site-header bg-blue-900 text-white py-4">
        <div className="header-container flex justify-between items-center max-w-5xl mx-auto px-4">
          <div className="logo font-bold text-lg">British Columbia Supreme Court Family Law Integration</div>
          <nav className="user-nav flex gap-4 items-center">
            <a href="/" className="hover:underline">Home</a>
            <span className="text-gray-300 italic">(IN CONSTRUCTION)</span>
          </nav>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto flex-1 py-8 px-4">
        {/* Email Form */}
        <div className="mb-8 bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold mb-2">Your email address is required to proceed with your request.</h2>
          <form id="contactForm" className="space-y-4">
            <div className="form-group">
              <label htmlFor="email" className="text-red-600 font-bold">Required: Email Address</label>
              <input type="email" id="email" name="email" required value={email} onChange={e => setEmail(e.target.value)} className="border-2 border-red-600 p-2 w-full rounded" />
            </div>
          </form>
        </div>

        {/* Voice Recorder Section */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold mb-4">Please explain your situation in your own words.</h2>

          {/* Language Selection */}
          <div className="mb-4">
            <label htmlFor="languageSelect" className="mr-2">Select Language:</label>
            <select id="languageSelect" value={language} onChange={e => setLanguage(e.target.value)} className="border p-2 rounded">
              <option value="en-US">English (US)</option>
              <option value="en-CA">English (CA)</option>
              <option value="hi-IN">Hindi</option>
              <option value="pa-IN">Punjabi</option>
              <option value="ar-SA">Arabic (Saudi Arabia)</option>
              <option value="fa-IR">Persian (Farsi)</option>
              <option value="zh-CN">Chinese (Mandarin - Simplified)</option>
              <option value="zh-HK">Chinese (Cantonese - Hong Kong)</option>
              <option value="zh-TW">Chinese (Traditional)</option>
              <option value="ja-JP">Japanese</option>
              <option value="ko-KR">Korean</option>
              <option value="es-ES">Spanish</option>
              <option value="fr-FR">French</option>
              <option value="de-DE">German</option>
              <option value="it-IT">Italian</option>
              <option value="pt-BR">Portuguese</option>
            </select>
          </div>

          {/* Microphone Device Selection */}
          <div className="mb-4">
            <label htmlFor="micDeviceSelect" className="mr-2">Select Microphone:</label>
            <select id="micDeviceSelect" value={selectedMic} onChange={e => setSelectedMic(e.target.value)} className="border p-2 rounded">
              {micDevices.length === 0 ? (
                <option value="">Loading microphones...</option>
              ) : (
                micDevices.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>{device.label || `Microphone ${micDevices.indexOf(device) + 1}`}</option>
                ))
              )}
            </select>
            <div className="text-sm text-gray-500 mt-1">{micStatus.details}</div>
          </div>

          {/* Microphone Status Indicator */}
          <div className="mb-4 flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full ${micStatus.status === 'available' ? 'bg-green-500' : micStatus.status === 'error' ? 'bg-red-500' : 'bg-yellow-400'}`}></div>
            <div className="text-sm">{micStatus.status === 'available' ? 'Microphone available' : micStatus.status === 'error' ? 'Error accessing microphone' : 'Checking microphone...'}</div>
          </div>

          {/* Microphone Test */}
          <div className="mb-4">
            <button type="button" onClick={handleTestMic} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Test Microphone</button>
            <div className="text-sm mt-2">{micTestStatus}</div>
            <div className="w-full h-2 bg-gray-200 rounded mt-2">
              <div className="h-2 rounded" style={{ width: `${micLevel}%`, backgroundColor: micLevel > 80 ? '#ff4444' : '#44ff44' }}></div>
            </div>
          </div>

          {/* Recording Controls */}
          <div className="mb-4 flex gap-4">
            <button type="button" onClick={handleStartRecording} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700" disabled={isRecording}>Start Recording</button>
            <button type="button" onClick={handleStopRecording} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700" disabled={!isRecording}>Stop Recording</button>
          </div>

          {/* Recording Indicator */}
          {recordingIndicator && (
            <div className="flex items-center gap-2 mb-4 animate-pulse">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-red-600 font-semibold">Recording...</span>
            </div>
          )}

          {/* Status and Input Display */}
          <div className="mb-2 text-sm text-gray-500">{permissionStatus}</div>
          <textarea id="voiceInput" name="voiceInput" className="w-full border rounded p-2" rows={4} placeholder="Your speech will appear here..." value={voiceInput} onChange={e => setVoiceInput(e.target.value)}></textarea>

          {/* Translate Button */}
          {showTranslate && (
            <button type="button" className="translate-button mt-4" onClick={async () => {
              setIsTranslating(true);
              const translatedText = await translateText(voiceInput);
              setVoiceInput(`${voiceInput}\n\nTranslated to English:\n${translatedText}`);
              setIsTranslating(false);
            }} disabled={isTranslating}>
              {isTranslating ? 'Translating...' : 'Translate to English'}
            </button>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="site-footer bg-gray-100 py-4 text-center text-sm text-gray-500 mt-8">
        <div className="footer-container flex flex-col md:flex-row justify-center gap-4">
          <nav className="footer-nav flex gap-4">
            <a href="#top" className="hover:underline">Back to Top</a>
            <a href="/" className="hover:underline">Home</a>
          </nav>
        </div>
      </footer>
      <style>{`
        .translate-button {
          padding: 0.5rem 1rem;
          background-color: #4285f4;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          margin-top: 1rem;
          transition: background-color 0.3s ease;
        }
        .translate-button:hover {
          background-color: #3367d6;
        }
        .translate-button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default VoiceRecorder; 