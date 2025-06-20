// Comprehensive test script that simulates the actual email sending process
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Simulate the getAllContacts function from supabaseClient.js
async function getAllContacts() {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('id, email, voiceInput, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contacts:', error);
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Exception in getAllContacts:', error);
    return { success: false, error: error.message, data: [] };
  }
}

// Simulate the sendEmailForContact function (without EmailJS for now)
async function sendEmailForContact(contactRecord, emailjsConfig) {
  try {
    if (!contactRecord || !contactRecord.email || !contactRecord.voiceInput) {
      console.error('Invalid contact record for email sending:', contactRecord);
      return { success: false, error: 'Invalid contact record' };
    }

    const templateParams = {
      to_email: 'andybaronca@gmail.com',
      from_name: 'Family Law Assistant',
      question: `Voice Recording from ${contactRecord.email}`,
      answer: contactRecord.voiceInput,
      timestamp: new Date(contactRecord.created_at).toLocaleString(),
      record_id: contactRecord.id,
      original_email: contactRecord.email
    };

    console.log('Would send email with params:', templateParams);
    
    // For testing purposes, we'll just log the email details
    // In a real scenario, this would call EmailJS
    console.log('✅ Email would be sent successfully for record:', contactRecord.id);
    return { success: true, result: 'Email logged for testing' };
  } catch (error) {
    console.error('Error sending email for contact:', error);
    return { success: false, error: error.message };
  }
}

// Simulate the sendEmailsForAllContacts function
async function sendEmailsForAllContacts(emailjsConfig) {
  try {
    console.log('Fetching all contacts for email sending...');
    
    const contactsResult = await getAllContacts();
    if (!contactsResult.success) {
      return { success: false, error: contactsResult.error };
    }

    const contacts = contactsResult.data;
    console.log(`Found ${contacts.length} contacts to send emails for`);

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const contact of contacts) {
      console.log(`Processing contact: ${contact.email} (ID: ${contact.id})`);
      
      const emailResult = await sendEmailForContact(contact, emailjsConfig);
      results.push({
        contactId: contact.id,
        email: contact.email,
        success: emailResult.success,
        error: emailResult.error
      });

      if (emailResult.success) {
        successCount++;
      } else {
        errorCount++;
      }

      // Add a small delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Email processing completed. Success: ${successCount}, Errors: ${errorCount}`);
    
    return {
      success: true,
      totalContacts: contacts.length,
      successCount,
      errorCount,
      results
    };
  } catch (error) {
    console.error('Error in sendEmailsForAllContacts:', error);
    return { success: false, error: error.message };
  }
}

async function runComprehensiveTest() {
  console.log('=== COMPREHENSIVE TEST - SIMULATING EMAIL SENDER ===\n');
  
  // Test 1: Get all contacts
  console.log('1. Testing getAllContacts...');
  const contactsResult = await getAllContacts();
  if (!contactsResult.success) {
    console.error('❌ Failed to get contacts:', contactsResult.error);
    return;
  }
  console.log(`✅ Successfully retrieved ${contactsResult.data.length} contacts`);
  
  // Test 2: Show sample contacts
  console.log('\n2. Sample contacts:');
  contactsResult.data.slice(0, 3).forEach((contact, index) => {
    console.log(`   ${index + 1}. ${contact.email} (ID: ${contact.id})`);
    console.log(`      Voice Input: ${contact.voiceInput.substring(0, 50)}...`);
    console.log(`      Created: ${contact.created_at}`);
  });
  
  // Test 3: Simulate email sending for all contacts
  console.log('\n3. Simulating email sending for all contacts...');
  const emailjsConfig = { publicKey: '8ebA--sjSPqBP4A9N' };
  const emailResult = await sendEmailsForAllContacts(emailjsConfig);
  
  if (emailResult.success) {
    console.log(`✅ Email simulation completed successfully!`);
    console.log(`   Total contacts: ${emailResult.totalContacts}`);
    console.log(`   Successful: ${emailResult.successCount}`);
    console.log(`   Errors: ${emailResult.errorCount}`);
  } else {
    console.error('❌ Email simulation failed:', emailResult.error);
  }
  
  // Test 4: Check for specific issues
  console.log('\n4. Analyzing potential issues...');
  
  // Check for contacts without voice input
  const contactsWithoutVoice = contactsResult.data.filter(c => !c.voiceInput || c.voiceInput.trim() === '');
  if (contactsWithoutVoice.length > 0) {
    console.log(`⚠️  Found ${contactsWithoutVoice.length} contacts without voice input:`);
    contactsWithoutVoice.forEach(c => console.log(`   - ${c.email} (ID: ${c.id})`));
  } else {
    console.log('✅ All contacts have voice input');
  }
  
  // Check for invalid emails
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const invalidEmails = contactsResult.data.filter(c => !emailRegex.test(c.email));
  if (invalidEmails.length > 0) {
    console.log(`⚠️  Found ${invalidEmails.length} contacts with invalid emails:`);
    invalidEmails.forEach(c => console.log(`   - ${c.email} (ID: ${c.id})`));
  } else {
    console.log('✅ All contacts have valid email addresses');
  }
}

// Run the comprehensive test
runComprehensiveTest().catch(console.error); 