import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = 'https://sqddisqxpkokbluiwliu.supabase.co';
// const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxZGRpc3F4cGtva2JsdWl3bGl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NjYxMTgsImV4cCI6MjA2MzU0MjExOH0.SAevvIurbpfN3scMkiPBYahdicfoFKnsvarXNXoHL24';

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
    if (!contactRecord || !contactRecord.email || !contactRecord.voiceInput) {
      console.error('Invalid contact record for email sending:', contactRecord);
      return { success: false, error: 'Invalid contact record' };
    }

    // Import emailjs dynamically to avoid SSR issues
    const emailjs = await import('@emailjs/browser');
    
    // Initialize EmailJS if not already initialized
    if (emailjsConfig && emailjsConfig.publicKey) {
      emailjs.init(emailjsConfig.publicKey);
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

    const result = await emailjs.send(
      'service_v3epzv2', 
      'template_fuz4031', 
      templateParams
    );

    console.log('Email sent successfully for record:', contactRecord.id);
    return { success: true, result };
  } catch (error) {
    console.error('Error sending email for contact:', error);
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
