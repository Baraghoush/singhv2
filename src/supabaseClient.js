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
