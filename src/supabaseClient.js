import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sqddisqxpkokbluiwliu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxZGRpc3F4cGtva2JsdWl3bGl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NjYxMTgsImV4cCI6MjA2MzU0MjExOH0.SAevvIurbpfN3scMkiPBYahdicfoFKnsvarXNXoHL24';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Example: Update contacts for a specific row (by id)
async function updateContacts(id, voiceInput) {
  const { data, error } = await supabase
    .from('FamilyLawAct')
    .update({ contacts: voiceInput })
    .eq('id', id);

  if (error) {
    console.error('Error updating contacts:', error);
    return null;
  }
  return data;
}
