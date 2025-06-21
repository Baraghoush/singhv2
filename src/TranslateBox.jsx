import React, { useState, useEffect } from 'react';

const TranslateBox = () => {
  const [inputText, setInputText] = useState('');
  const [translations, setTranslations] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState(['es', 'fr', 'de', 'it', 'pt']);

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
    'pa': 'Punjabi'
  };

  const translateText = async (text, targetLang) => {
    try {
      // Using Google Translate API with environment variable
      const apiKey = process.env.REACT_APP_GOOGLE_TRANSLATE_API_KEY;
      
      if (!apiKey) {
        throw new Error('Google Translate API key not found. Please check your .env file.');
      }

      const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          target: targetLang,
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

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    
    setIsLoading(true);
    const newTranslations = {};
    
    for (const lang of selectedLanguages) {
      try {
        const translatedText = await translateText(inputText, lang);
        newTranslations[lang] = translatedText;
      } catch (error) {
        newTranslations[lang] = 'Translation failed';
      }
    }
    
    setTranslations(newTranslations);
    setIsLoading(false);
  };

  const toggleLanguage = (langCode) => {
    setSelectedLanguages(prev => 
      prev.includes(langCode) 
        ? prev.filter(lang => lang !== langCode)
        : [...prev, langCode]
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        Multi-Language Translator
      </h2>
      
      {/* Input Section */}
      <div className="mb-6">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter text to translate..."
          className="w-full p-4 border border-gray-300 rounded-lg resize-none h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        
        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={handleTranslate}
            disabled={isLoading || !inputText.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Translating...' : 'Translate'}
          </button>
          
          <span className="text-sm text-gray-600">
            {inputText.length} characters
          </span>
        </div>
      </div>

      {/* Language Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Select Languages:</h3>
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

      {/* Translation Results */}
      {Object.keys(translations).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Translations:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedLanguages.map(langCode => (
              <div key={langCode} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-gray-800">
                    {languages[langCode]}
                  </h4>
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

      {/* Note about API */}
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-green-800">
          <strong>✓ Ready to use:</strong> Google Translate API is configured with your environment variable.
          Make sure your API key has the Google Translate API enabled in your Google Cloud Console.
        </p>
      </div>
    </div>
  );
};

export default TranslateBox; 