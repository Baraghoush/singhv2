import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Validate that environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  throw new Error('Supabase credentials not found in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test function to check Supabase connection
export async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    console.log('URL:', supabaseUrl);
    console.log('Key:', supabaseAnonKey.substring(0, 20) + '...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('contacts')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Supabase connection successful!');
    return { success: true, data };
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return { success: false, error: error.message };
  }
}

// Enhanced test function to check table structure and permissions
export async function testTableStructure() {
  try {
    console.log('Testing table structure and permissions...');
    
    // Test 1: Check if table exists and get its structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('contacts')
      .select('*')
      .limit(0);
    
    if (tableError) {
      console.error('Table structure error:', tableError);
      return { success: false, error: `Table error: ${tableError.message}` };
    }
    
    console.log('Table exists and is accessible');
    
    // Test 2: Try to insert a test record with unique email
    const timestamp = Date.now();
    const testData = {
      email: `test-${timestamp}@example.com`,
      voiceInput: 'Test voice input',
      created_at: new Date().toISOString()
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('contacts')
      .insert([testData])
      .select('id')
      .single();
    
    if (insertError) {
      console.error('Insert test failed:', insertError);
      return { 
        success: false, 
        error: `Insert failed: ${insertError.message}`,
        details: insertError
      };
    }
    
    console.log('Insert test successful:', insertData);
    
    // Test 3: Try to delete the test record
    if (insertData && insertData.id) {
      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .eq('id', insertData.id);
      
      if (deleteError) {
        console.error('Delete test failed:', deleteError);
        return { 
          success: false, 
          error: `Delete failed: ${deleteError.message}`,
          details: deleteError
        };
      }
      
      console.log('Delete test successful');
    }
    
    return { success: true, message: 'All tests passed' };
  } catch (error) {
    console.error('Table structure test failed:', error);
    return { success: false, error: error.message };
  }
}

// Example: Update contacts for a specific row (by id)
export async function updateContacts(id, voiceInput) {
  const { data, error } = await supabase
    .from('contacts')
    .update({ voiceInput: voiceInput })
    .eq('id', id);

  if (error) {
    console.error('Error updating contacts:', error);
    return null;
  }
  return data;
}

// Function to get all records from contacts table
export async function getAllContacts() {
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

// Function to get contacts by email
export async function getContactsByEmail(email) {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('id, email, voiceInput, created_at')
      .eq('email', email)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contacts by email:', error);
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Exception in getContactsByEmail:', error);
    return { success: false, error: error.message, data: [] };
  }
}

// Function to send email for a specific contact record
export async function sendEmailForContact(contactRecord, emailjsConfig) {
  try {
    console.log('=== SEND EMAIL FOR CONTACT ===');
    console.log('Contact record:', contactRecord);
    
    if (!contactRecord || !contactRecord.email || !contactRecord.voiceInput) {
      console.error('Invalid contact record for email sending:', contactRecord);
      return { success: false, error: 'Invalid contact record - missing email or voice input' };
    }

    // Additional validation
    if (contactRecord.email.trim() === '') {
      console.error('Empty email address:', contactRecord);
      return { success: false, error: 'Empty email address' };
    }

    if (contactRecord.voiceInput.trim() === '') {
      console.error('Empty voice input:', contactRecord);
      return { success: false, error: 'Empty voice input' };
    }

    // Import emailjs dynamically to avoid SSR issues
    const emailjs = await import('@emailjs/browser');
    
    // Initialize EmailJS if not already initialized
    if (emailjsConfig && emailjsConfig.publicKey) {
      emailjs.init(emailjsConfig.publicKey);
      console.log('EmailJS initialized with public key');
    } else {
      console.error('Missing EmailJS public key');
      return { success: false, error: 'Missing EmailJS configuration' };
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

    console.log('Sending email with template params:', templateParams);

    const result = await emailjs.send(
      'service_v3epzv2', 
      'template_fuz4031', 
      templateParams
    );

    console.log('✅ Email sent successfully for record:', contactRecord.id);
    console.log('EmailJS result:', result);
    return { success: true, result };
  } catch (error) {
    console.error('❌ Error sending email for contact:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    return { success: false, error: error.message };
  }
}

// Function to send emails for all contacts
export async function sendEmailsForAllContacts(emailjsConfig) {
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
      console.log(`Sending email for contact: ${contact.email} (ID: ${contact.id})`);
      
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
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`Email sending completed. Success: ${successCount}, Errors: ${errorCount}`);
    
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

// Function to send emails for contacts by email address
export async function sendEmailsForEmailAddress(email, emailjsConfig) {
  try {
    console.log(`Fetching contacts for email: ${email}`);
    
    const contactsResult = await getContactsByEmail(email);
    if (!contactsResult.success) {
      return { success: false, error: contactsResult.error };
    }

    const contacts = contactsResult.data;
    console.log(`Found ${contacts.length} contacts for email: ${email}`);

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const contact of contacts) {
      console.log(`Sending email for contact: ${contact.email} (ID: ${contact.id})`);
      
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
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`Email sending completed for ${email}. Success: ${successCount}, Errors: ${errorCount}`);
    
    return {
      success: true,
      emailAddress: email,
      totalContacts: contacts.length,
      successCount,
      errorCount,
      results
    };
  } catch (error) {
    console.error('Error in sendEmailsForEmailAddress:', error);
    return { success: false, error: error.message };
  }
}

// Function to clean up invalid records (empty voice input or invalid emails)
export async function cleanupInvalidRecords() {
  try {
    console.log('=== CLEANING UP INVALID RECORDS ===');
    
    // Get all contacts
    const contactsResult = await getAllContacts();
    if (!contactsResult.success) {
      return { success: false, error: contactsResult.error };
    }

    const contacts = contactsResult.data;
    const recordsToDelete = [];
    
    // Find records with empty voice input or invalid emails
    contacts.forEach(contact => {
      const hasEmptyVoice = !contact.voiceInput || contact.voiceInput.trim() === '';
      const hasEmptyEmail = !contact.email || contact.email.trim() === '';
      const hasInvalidEmail = contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email);
      
      if (hasEmptyVoice || hasEmptyEmail || hasInvalidEmail) {
        recordsToDelete.push(contact.id);
        console.log(`Marking for deletion: ${contact.email} (ID: ${contact.id}) - Empty voice: ${hasEmptyVoice}, Empty email: ${hasEmptyEmail}, Invalid email: ${hasInvalidEmail}`);
      }
    });

    if (recordsToDelete.length === 0) {
      console.log('No invalid records found to clean up');
      return { success: true, deletedCount: 0, message: 'No invalid records found' };
    }

    // Delete the invalid records
    const { error: deleteError } = await supabase
      .from('contacts')
      .delete()
      .in('id', recordsToDelete);

    if (deleteError) {
      console.error('Error deleting invalid records:', deleteError);
      return { success: false, error: deleteError.message };
    }

    console.log(`✅ Successfully deleted ${recordsToDelete.length} invalid records`);
    return { 
      success: true, 
      deletedCount: recordsToDelete.length, 
      message: `Deleted ${recordsToDelete.length} invalid records` 
    };
  } catch (error) {
    console.error('Exception in cleanupInvalidRecords:', error);
    return { success: false, error: error.message };
  }
}
