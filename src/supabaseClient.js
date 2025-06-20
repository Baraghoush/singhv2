import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sqddisqxpkokbluiwliu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxZGRpc3F4cGtva2JsdWl3bGl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NjYxMTgsImV4cCI6MjA2MzU0MjExOH0.SAevvIurbpfN3scMkiPBYahdicfoFKnsvarXNXoHL24';

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
