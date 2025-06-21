import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import { supabase, updateContacts, testSupabaseConnection, testTableStructure } from './supabaseClient';

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
  const [englishTranslation, setEnglishTranslation] = useState('');
  const [permissionStatus, setPermissionStatus] = useState('');
  const [showTranslate, setShowTranslate] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState('unknown');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [lastOperation, setLastOperation] = useState(''); // 'insert' or 'update'

  // Translation state variables (from TranslateBox)
  const [translations, setTranslations] = useState({});
  const [isLoadingTranslations, setIsLoadingTranslations] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState(['es', 'fr', 'de', 'it', 'pt']);
  const [showTranslationSection, setShowTranslationSection] = useState(false);

  // Language options for translation
  const languages = {
    'es': 'Spanish',
    'fr': 'French', 
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese',
    'ru': 'Russian',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'pa': 'Punjabi',
    'fa': 'Persian'
  };

  // Refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  const animationFrameRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioStreamRef = useRef(null);

  // EmailJS init
  useEffect(() => {
    if (config.EMAILJS.publicKey) {
      emailjs.init(config.EMAILJS.publicKey);
    }
  }, []);

  // Test Supabase connection on mount
  useEffect(() => {
    const testConnection = async () => {
      console.log('Testing Supabase connection on component mount...');
      setSupabaseStatus('testing');
      
      // First test basic connection
      const connectionResult = await testSupabaseConnection();
      if (!connectionResult.success) {
        setSupabaseStatus('error');
        console.error('Supabase connection failed:', connectionResult.error);
        return;
      }
      
      // Then test table structure and permissions
      const tableResult = await testTableStructure();
      if (tableResult.success) {
        setSupabaseStatus('connected');
        console.log('Supabase connection and table structure successful!');
      } else {
        setSupabaseStatus('error');
        console.error('Table structure test failed:', tableResult.error);
        if (tableResult.details) {
          console.error('Error details:', tableResult.details);
        }
      }
    };
    testConnection();
  }, []);

  // Manual test function
  const handleTestSupabase = async () => {
    setSupabaseStatus('testing');
    
    // Test basic connection
    const connectionResult = await testSupabaseConnection();
    if (!connectionResult.success) {
      setSupabaseStatus('error');
      alert(`Supabase connection failed: ${connectionResult.error}`);
      return;
    }
    
    // Test table structure
    const tableResult = await testTableStructure();
    if (tableResult.success) {
      setSupabaseStatus('connected');
      alert('Supabase connection and table structure successful!');
    } else {
      setSupabaseStatus('error');
      alert(`Table structure test failed: ${tableResult.error}`);
    }
  };

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
        console.log('=== SPEECH RECOGNITION RESULT ===');
        console.log('Raw transcript:', transcript);
        console.log('Current email:', email);
        
        let finalInput = transcript;
        let translatedText = '';
        
        if (language !== 'en-US') {
          console.log('Translating from', language, 'to English...');
          translatedText = await translateText(transcript);
          finalInput = transcript; // Keep original transcript in voiceInput
          setEnglishTranslation(translatedText); // Store translation separately
          console.log('Original input:', finalInput);
          console.log('English translation:', translatedText);
        } else {
          setEnglishTranslation(''); // Clear translation if language is English
        }
        
        setVoiceInput(finalInput);
        console.log('Voice input updated, length:', finalInput.length);
        
        // Save to Supabase when transcribed and email is present
        if (email) {
          console.log('Email present, attempting to save to Supabase...');
          const result = await saveVoiceInputToSupabase(email, finalInput, translatedText);
          if (result) {
            console.log('Save successful, showing success message');
            setShowSuccessMessage(true);
            // Hide success message after 10 seconds
            setTimeout(() => setShowSuccessMessage(false), 10000);
          } else {
            console.error('Save failed, not showing success message');
          }
        } else {
          console.log('No email present, skipping save to Supabase');
        }
      };
      recognition.onerror = (event) => {
        setMicStatus({ status: 'error', details: `Speech recognition error: ${event.error}` });
      };
      recognition.onend = () => {
        // Only restart if we're still recording and the recognition was not manually stopped
        if (isRecording) {
          // Add a small delay to ensure state updates have taken effect
          setTimeout(() => {
            if (isRecording && recognitionRef.current) {
              recognitionRef.current.start();
            }
          }, 100);
        }
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
      audioStreamRef.current = stream; // Store stream reference for cleanup
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
      console.log('=== STOPPING RECORDING ===');
      
      // Set recording state to false first to prevent speech recognition from restarting
      setIsRecording(false);
      setRecordingIndicator(false);
      
      // Stop speech recognition
      if (recognitionRef.current) {
        console.log('Stopping speech recognition...');
        recognitionRef.current.stop();
      }
      
      // Stop media recorder
      if (mediaRecorderRef.current.state !== 'inactive') {
        console.log('Stopping media recorder...');
        mediaRecorderRef.current.stop();
      }
      
      // Set up the onstop handler
      mediaRecorderRef.current.onstop = async () => {
        console.log('Media recorder stopped, processing audio...');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        
        // Stop all tracks in the stream to release microphone
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach(track => {
            console.log('Stopping track:', track.kind);
            track.stop();
          });
          audioStreamRef.current = null; // Clear the reference
        }
        
        // Send email with recording
        if (email) {
          await sendEmailToAndy(voiceInput, email);
        }
        
        // Show success message if voice input exists
        if (voiceInput && email) {
          setShowSuccessMessage(true);
          // Hide success message after 10 seconds
          setTimeout(() => setShowSuccessMessage(false), 10000);
        }
        
        setMicStatus({ status: 'available', details: 'Recording completed' });
        console.log('Recording cleanup completed');
      };
    } else {
      console.log('No active recording to stop');
    }
  };

  // Force stop recording (emergency stop)
  const forceStopRecording = () => {
    console.log('=== FORCE STOPPING RECORDING ===');
    
    // Set states to false immediately
    setIsRecording(false);
    setRecordingIndicator(false);
    
    // Stop speech recognition immediately
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.log('Error stopping speech recognition:', error);
      }
    }
    
    // Stop media recorder immediately
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (error) {
        console.log('Error stopping media recorder:', error);
      }
    }
    
    // Stop all audio tracks immediately
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (error) {
          console.log('Error stopping track:', error);
        }
      });
      audioStreamRef.current = null;
    }
    
    setMicStatus({ status: 'available', details: 'Recording force stopped' });
    console.log('Force stop completed');
  };

  // Email sending logic
  const sendEmailToAndy = async (voiceInput, email) => {
    try {
      let emailContent = voiceInput;
      
      // Include English translation if available
      if (englishTranslation && englishTranslation.trim()) {
        emailContent = `Original Input:\n${voiceInput}\n\nEnglish Translation:\n${englishTranslation}`;
      }
      
      const templateParams = {
        to_email: 'andybaronca@gmail.com',
        from_name: 'Family Law Assistant',
        question: `Voice Recording from ${email}`,
        answer: emailContent,
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

  // Multi-language translation function (from TranslateBox)
  const translateToMultipleLanguages = async (text, targetLanguages) => {
    try {
      const apiKey = config.GOOGLE_TRANSLATE_API_KEY;
      
      if (!apiKey) {
        throw new Error('Google Translate API key not found.');
      }

      const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          target: targetLanguages[0], // We'll handle multiple languages in a loop
          source: 'en'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data.translations[0].translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      return `Translation failed: ${error.message}`;
    }
  };

  // Handle multi-language translation
  const handleTranslateToMultipleLanguages = async () => {
    if (!voiceInput.trim()) return;
    
    setIsLoadingTranslations(true);
    const newTranslations = {};
    
    // Use English translation if available, otherwise use original voice input
    const sourceText = englishTranslation && englishTranslation.trim() ? englishTranslation : voiceInput;
    
    for (const lang of selectedLanguages) {
      try {
        const translatedText = await translateToMultipleLanguages(sourceText, [lang]);
        newTranslations[lang] = translatedText;
      } catch (error) {
        newTranslations[lang] = 'Translation failed';
      }
    }
    
    setTranslations(newTranslations);
    setIsLoadingTranslations(false);
  };

  // Toggle language selection for translation
  const toggleLanguage = (langCode) => {
    setSelectedLanguages(prev => 
      prev.includes(langCode) 
        ? prev.filter(lang => lang !== langCode)
        : [...prev, langCode]
    );
  };

  // Show translate button if text is entered
  useEffect(() => {
    setShowTranslate(!!voiceInput);
  }, [voiceInput]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('=== COMPONENT CLEANUP ===');
      
      // Cancel animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Close audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      
      // Stop speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      
      // Stop media recorder if active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      
      // Stop all audio tracks
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => {
          console.log('Stopping track during cleanup:', track.kind);
          track.stop();
        });
      }
      
      console.log('Component cleanup completed');
    };
  }, []);

  // Add this helper function inside the component
  const saveVoiceInputToSupabase = async (email, voiceInput, englishTranslation) => {
    try {
      console.log('=== SAVE VOICE INPUT TO SUPABASE ===');
      console.log('Email:', email);
      console.log('VoiceInput length:', voiceInput ? voiceInput.length : 0);
      console.log('VoiceInput preview:', voiceInput ? voiceInput.substring(0, 100) + '...' : 'null');
      console.log('EnglishTranslation length:', englishTranslation ? englishTranslation.length : 0);
      console.log('EnglishTranslation preview:', englishTranslation ? englishTranslation.substring(0, 100) + '...' : 'null');
      
      if (!email || !voiceInput) {
        console.error('Missing required data: email or voiceInput');
        console.error('Email present:', !!email);
        console.error('VoiceInput present:', !!voiceInput);
        return null;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.error('Invalid email format:', email);
        return null;
      }

      // Prepare data for insertion/update
      const insertData = { 
        email: email.trim(), 
        voiceInput: voiceInput.trim(),
        englishTranslation: englishTranslation ? englishTranslation.trim() : null,
        created_at: new Date().toISOString()
      };
      
      console.log('Insert/update data:', insertData);

      // First, check if a record with this email already exists
      const { data: existingRecord, error: checkError } = await supabase
        .from('contacts')
        .select('id, email, voiceInput, englishTranslation, created_at')
        .eq('email', email.trim())
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking existing record:', checkError);
        return null;
      }

      let result;
      if (existingRecord) {
        // Update existing record
        console.log('Updating existing record:', existingRecord.id);
        const { data, error } = await supabase
          .from('contacts')
          .update({ 
            voiceInput: voiceInput.trim(),
            englishTranslation: englishTranslation ? englishTranslation.trim() : null,
            created_at: new Date().toISOString()
          })
          .eq('id', existingRecord.id)
          .select('id, email, voiceInput, englishTranslation, created_at')
          .single();

        if (error) {
          console.error('=== SUPABASE UPDATE ERROR ===');
          console.error('Error message:', error.message);
          console.error('Error details:', error.details);
          console.error('Error hint:', error.hint);
          console.error('Error code:', error.code);
          console.error('Full error object:', error);
          return null;
        }
        
        console.log('=== SUPABASE UPDATE SUCCESS ===');
        console.log('Updated data:', data);
        result = data;
        setLastOperation('update');
      } else {
        // Insert new record
        console.log('Creating new record');
        const { data, error } = await supabase
          .from('contacts')
          .insert([insertData])
          .select('id, email, voiceInput, englishTranslation, created_at')
          .single();

        if (error) {
          console.error('=== SUPABASE INSERT ERROR ===');
          console.error('Error message:', error.message);
          console.error('Error details:', error.details);
          console.error('Error hint:', error.hint);
          console.error('Error code:', error.code);
          console.error('Full error object:', error);
          return null;
        }
        
        console.log('=== SUPABASE INSERT SUCCESS ===');
        console.log('Inserted data:', data);
        result = data;
        setLastOperation('insert');
      }
      
      // Verify the record was actually saved
      await verifyRecordSaved(result.id);
      
      // Send email automatically after successful save
      console.log('=== SENDING EMAIL AUTOMATICALLY ===');
      const emailResult = await sendEmailToAndy(voiceInput, email);
      if (emailResult) {
        console.log('Email sent successfully');
      } else {
        console.error('Failed to send email');
      }
      
      return result;
    } catch (error) {
      console.error('=== EXCEPTION IN SAVE VOICE INPUT ===');
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Full error object:', error);
      return null;
    }
  };

  // Function to verify that a record was actually saved
  const verifyRecordSaved = async (recordId) => {
    try {
      console.log('=== VERIFYING RECORD SAVED ===');
      console.log('Checking for record ID:', recordId);
      
      const { data, error } = await supabase
        .from('contacts')
        .select('id, email, voiceInput, englishTranslation, created_at')
        .eq('id', recordId)
        .single();
      
      if (error) {
        console.error('Error verifying record:', error);
        return false;
      }
      
      if (data) {
        console.log('=== RECORD VERIFICATION SUCCESS ===');
        console.log('Found record:', data);
        return true;
      } else {
        console.error('Record not found after insertion');
        return false;
      }
    } catch (error) {
      console.error('Exception in verifyRecordSaved:', error);
      return false;
    }
  };

  // Function to check all records for an email
  const checkRecordsForEmail = async (email) => {
    try {
      console.log('=== CHECKING RECORDS FOR EMAIL ===');
      console.log('Email:', email);
      
      const { data, error } = await supabase
        .from('contacts')
        .select('id, email, voiceInput, englishTranslation, created_at')
        .eq('email', email)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error checking records:', error);
        return [];
      }
      
      console.log('=== RECORDS FOUND ===');
      console.log('Number of records:', data.length);
      data.forEach((record, index) => {
        console.log(`Record ${index + 1}:`, record);
      });
      
      return data;
    } catch (error) {
      console.error('Exception in checkRecordsForEmail:', error);
      return [];
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
            <Link to="/" className="hover:underline">Home</Link>
            <Link to="/email-sender" className="hover:underline">Email Sender</Link>
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

        {/* Supabase Connection Test */}
        <div className="mb-8 bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold mb-4">Database Connection Test</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-4 h-4 rounded-full ${
              supabaseStatus === 'connected' ? 'bg-green-500' : 
              supabaseStatus === 'error' ? 'bg-red-500' : 
              supabaseStatus === 'testing' ? 'bg-yellow-400' : 'bg-gray-400'
            }`}></div>
            <span className="text-sm">
              {supabaseStatus === 'connected' ? 'Database Connected' : 
               supabaseStatus === 'error' ? 'Database Connection Error' : 
               supabaseStatus === 'testing' ? 'Testing Connection...' : 'Connection Status Unknown'}
            </span>
          </div>
          <div className="flex gap-2">
            <button 
              type="button" 
              onClick={handleTestSupabase} 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              disabled={supabaseStatus === 'testing'}
            >
              {supabaseStatus === 'testing' ? 'Testing...' : 'Test Database Connection'}
            </button>
            {email && (
              <button 
                type="button" 
                onClick={() => checkRecordsForEmail(email)} 
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Check Records for Email
              </button>
            )}
          </div>
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
            <button type="button" onClick={forceStopRecording} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700" disabled={!isRecording}>Stop Recording</button>
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

          {/* English Translation Text Box */}
          {language !== 'en-US' && (
            <div className="mt-4">
              <label htmlFor="englishTranslation" className="block text-sm font-medium text-gray-700 mb-2">
                English Translation:
              </label>
              <textarea 
                id="englishTranslation" 
                name="englishTranslation" 
                className="w-full border rounded p-2 bg-gray-50" 
                rows={4} 
                placeholder="English translation will appear here..." 
                value={englishTranslation} 
                onChange={e => setEnglishTranslation(e.target.value)}
                readOnly={language !== 'en-US'}
              ></textarea>
            </div>
          )}

          {/* Success Message */}
          {showSuccessMessage && (
            <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-green-500 rounded-full mr-3 flex-shrink-0"></div>
                <div>
                  <p className="font-semibold">Thank you for your request.</p>
                  <p>Your voice input has been saved to the database.</p>
                  <p className="text-sm mt-1">Email: {email}</p>
                  <p>Input length: {voiceInput.length} characters</p>
                  {englishTranslation && (
                    <p className="text-sm">English translation length: {englishTranslation.length} characters</p>
                  )}
                  <p>You will receive a reply within 12 hours.</p>
                  <p className="text-sm mt-1">Last operation: {lastOperation}</p>
                  <button
                    onClick={async () => {
                      const result = await sendEmailToAndy(voiceInput, email);
                      if (result) {
                        alert('Email sent successfully!');
                      } else {
                        alert('Failed to send email. Please try again.');
                      }
                    }}
                    className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    Send Email Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Translate Button */}
          {showTranslate && (
            <button type="button" className="translate-button mt-4" onClick={async () => {
              setIsTranslating(true);
              const translatedText = await translateText(voiceInput);
              setEnglishTranslation(translatedText);
              setIsTranslating(false);
            }} disabled={isTranslating}>
              {isTranslating ? 'Translating...' : 'Translate to English'}
            </button>
          )}

          {/* Multi-Language Translation Section */}
          {showTranslate && (
            <div className="mt-6 border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Multi-Language Translation</h3>
                <button
                  onClick={() => setShowTranslationSection(!showTranslationSection)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  {showTranslationSection ? 'Hide' : 'Show'} Translation Options
                </button>
              </div>

              {showTranslationSection && (
                <>
                  {/* Language Selection */}
                  <div className="mb-4">
                    <h4 className="text-md font-semibold mb-3">Select Languages to Translate To:</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(languages).map(([code, name]) => (
                        <button
                          key={code}
                          onClick={() => toggleLanguage(code)}
                          className={`px-3 py-1 rounded-full text-sm border ${
                            selectedLanguages.includes(code)
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Translation Button */}
                  <div className="mb-4">
                    <button
                      onClick={handleTranslateToMultipleLanguages}
                      disabled={isLoadingTranslations || !voiceInput.trim()}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isLoadingTranslations ? 'Translating...' : `Translate to ${selectedLanguages.length} Languages`}
                    </button>
                  </div>

                  {/* Translation Results */}
                  {Object.keys(translations).length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-md font-semibold">Translation Results:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedLanguages.map(langCode => (
                          <div key={langCode} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <h5 className="font-semibold text-gray-800">
                                {languages[langCode]}
                              </h5>
                              <span className="text-xs text-gray-500 uppercase">{langCode}</span>
                            </div>
                            <div className="bg-white p-3 rounded border min-h-[60px]">
                              {translations[langCode] || 'No translation available'}
                            </div>
                            <button
                              onClick={() => navigator.clipboard.writeText(translations[langCode])}
                              className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                            >
                              Copy to clipboard
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="site-footer bg-gray-100 py-4 text-center text-sm text-gray-500 mt-8">
        <div className="footer-container flex flex-col md:flex-row justify-center gap-4">
          <nav className="footer-nav flex gap-4">
            <Link to="/" className="hover:underline">Home</Link>
            <Link to="/email-sender" className="hover:underline">Email Sender</Link>
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