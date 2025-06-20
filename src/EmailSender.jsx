import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  getAllContacts, 
  getContactsByEmail, 
  sendEmailsForAllContacts, 
  sendEmailsForEmailAddress 
} from './supabaseClient';

const EmailSender = () => {
  const [allContacts, setAllContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState('');
  const [selectedEmail, setSelectedEmail] = useState('');
  const [emailjsConfig] = useState({ publicKey: '8ebA--sjSPqBP4A9N' });

  // Load all contacts on component mount
  useEffect(() => {
    loadAllContacts();
  }, []);

  const loadAllContacts = async () => {
    setLoading(true);
    try {
      const result = await getAllContacts();
      if (result.success) {
        setAllContacts(result.data);
        setFilteredContacts(result.data);
        console.log(`Loaded ${result.data.length} contacts`);
      } else {
        console.error('Failed to load contacts:', result.error);
        setEmailStatus(`Error loading contacts: ${result.error}`);
      }
    } catch (error) {
      console.error('Exception loading contacts:', error);
      setEmailStatus(`Exception loading contacts: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendAllEmails = async () => {
    if (!allContacts.length) {
      setEmailStatus('No contacts found to send emails to');
      return;
    }

    setLoading(true);
    setEmailStatus('Sending emails for all contacts...');
    
    try {
      const result = await sendEmailsForAllContacts(emailjsConfig);
      if (result.success) {
        setEmailStatus(
          `Email sending completed! Success: ${result.successCount}, Errors: ${result.errorCount} out of ${result.totalContacts} total contacts.`
        );
      } else {
        setEmailStatus(`Email sending failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Exception sending emails:', error);
      setEmailStatus(`Exception sending emails: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmailsForEmail = async () => {
    if (!selectedEmail) {
      setEmailStatus('Please enter an email address');
      return;
    }

    setLoading(true);
    setEmailStatus(`Sending emails for ${selectedEmail}...`);
    
    try {
      const result = await sendEmailsForEmailAddress(selectedEmail, emailjsConfig);
      if (result.success) {
        setEmailStatus(
          `Email sending completed for ${selectedEmail}! Success: ${result.successCount}, Errors: ${result.errorCount} out of ${result.totalContacts} total contacts.`
        );
      } else {
        setEmailStatus(`Email sending failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Exception sending emails:', error);
      setEmailStatus(`Exception sending emails: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterByEmail = (email) => {
    setSelectedEmail(email);
    if (email) {
      const filtered = allContacts.filter(contact => 
        contact.email.toLowerCase().includes(email.toLowerCase())
      );
      setFilteredContacts(filtered);
    } else {
      setFilteredContacts(allContacts);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="site-header bg-blue-900 text-white py-4">
        <div className="header-container flex justify-between items-center max-w-5xl mx-auto px-4">
          <div className="logo font-bold text-lg">Email Sender - Supabase Data</div>
          <nav className="user-nav flex gap-4 items-center">
            <Link to="/" className="hover:underline">Home</Link>
            <Link to="/voice-recorder" className="hover:underline">Voice Recorder</Link>
          </nav>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto flex-1 py-8 px-4">
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">Send Emails with Supabase Data</h1>
          <p className="text-gray-600 mb-4">
            This tool sends emails with the exact content that has been stored in Supabase.
            Each email will contain the voice input and associated metadata.
          </p>
          
          <div className="flex gap-4 mb-6">
            <button
              onClick={loadAllContacts}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Loading...' : 'Refresh Contacts'}
            </button>
            <button
              onClick={handleSendAllEmails}
              disabled={loading || !allContacts.length}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? 'Sending...' : `Send All Emails (${allContacts.length})`}
            </button>
          </div>

          {/* Email Filter */}
          <div className="mb-6">
            <label htmlFor="emailFilter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Email Address:
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                id="emailFilter"
                value={selectedEmail}
                onChange={(e) => handleFilterByEmail(e.target.value)}
                placeholder="Enter email to filter..."
                className="flex-1 border border-gray-300 rounded px-3 py-2"
              />
              <button
                onClick={handleSendEmailsForEmail}
                disabled={loading || !selectedEmail}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:bg-gray-400"
              >
                {loading ? 'Sending...' : 'Send for This Email'}
              </button>
            </div>
          </div>

          {/* Status Message */}
          {emailStatus && (
            <div className={`p-4 rounded-lg mb-6 ${
              emailStatus.includes('Error') || emailStatus.includes('failed') 
                ? 'bg-red-100 border border-red-400 text-red-700' 
                : 'bg-green-100 border border-green-400 text-green-700'
            }`}>
              {emailStatus}
            </div>
          )}

          {/* Contacts Summary */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Contacts Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-gray-50 p-3 rounded">
                <div className="font-semibold">Total Contacts</div>
                <div className="text-2xl font-bold text-blue-600">{allContacts.length}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="font-semibold">Filtered Contacts</div>
                <div className="text-2xl font-bold text-green-600">{filteredContacts.length}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="font-semibold">Unique Emails</div>
                <div className="text-2xl font-bold text-purple-600">
                  {new Set(allContacts.map(c => c.email)).size}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contacts List */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold mb-4">
            Contacts ({filteredContacts.length} of {allContacts.length})
          </h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading contacts...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No contacts found
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredContacts.map((contact) => (
                <div key={contact.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold text-blue-600">{contact.email}</div>
                    <div className="text-sm text-gray-500">{formatDate(contact.created_at)}</div>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">ID: {contact.id}</div>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <div className="font-medium mb-1">Voice Input:</div>
                    <div className="whitespace-pre-wrap">
                      {contact.voiceInput.length > 200 
                        ? `${contact.voiceInput.substring(0, 200)}...` 
                        : contact.voiceInput
                      }
                    </div>
                    {contact.voiceInput.length > 200 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Length: {contact.voiceInput.length} characters
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="site-footer bg-gray-100 py-4 text-center text-sm text-gray-500 mt-8">
        <div className="footer-container flex flex-col md:flex-row justify-center gap-4">
          <nav className="footer-nav flex gap-4">
            <Link to="/" className="hover:underline">Home</Link>
            <Link to="/voice-recorder" className="hover:underline">Voice Recorder</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default EmailSender; 