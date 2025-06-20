// Debug test script for Supabase and EmailJS
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Check environment variables
console.log('=== ENVIRONMENT VARIABLES CHECK ===');
console.log('SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('SUPABASE_ANON_KEY:', process.env.REACT_APP_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
console.log('GOOGLE_API_KEY:', process.env.REACT_APP_GOOGLE_API_KEY ? 'SET' : 'NOT SET');

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabaseConnection() {
  console.log('\n=== TESTING SUPABASE CONNECTION ===');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('contacts')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
}

async function testTableStructure() {
  console.log('\n=== TESTING TABLE STRUCTURE ===');
  
  try {
    // Test if table exists and get its structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('contacts')
      .select('*')
      .limit(0);
    
    if (tableError) {
      console.error('❌ Table structure error:', tableError);
      return false;
    }
    
    console.log('✅ Table exists and is accessible');
    
    // Test insert with unique email
    const timestamp = Date.now();
    const testData = {
      email: `test-${timestamp}@example.com`,
      voiceInput: 'Test voice input from debug script',
      created_at: new Date().toISOString()
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('contacts')
      .insert([testData])
      .select('id')
      .single();
    
    if (insertError) {
      console.error('❌ Insert test failed:', insertError);
      return false;
    }
    
    console.log('✅ Insert test successful:', insertData);
    
    // Test delete the test record
    if (insertData && insertData.id) {
      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .eq('id', insertData.id);
      
      if (deleteError) {
        console.error('❌ Delete test failed:', deleteError);
        return false;
      }
      
      console.log('✅ Delete test successful');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Table structure test failed:', error);
    return false;
  }
}

async function testGetAllContacts() {
  console.log('\n=== TESTING GET ALL CONTACTS ===');
  
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('id, email, voiceInput, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching contacts:', error);
      return false;
    }

    console.log(`✅ Successfully fetched ${data.length} contacts`);
    if (data.length > 0) {
      console.log('Sample contact:', data[0]);
    }
    return true;
  } catch (error) {
    console.error('❌ Exception in getAllContacts:', error);
    return false;
  }
}

async function runTests() {
  console.log('Starting debug tests...\n');
  
  const connectionTest = await testSupabaseConnection();
  if (!connectionTest) {
    console.log('\n❌ Connection test failed. Stopping tests.');
    return;
  }
  
  const tableTest = await testTableStructure();
  if (!tableTest) {
    console.log('\n❌ Table structure test failed.');
  }
  
  const contactsTest = await testGetAllContacts();
  if (!contactsTest) {
    console.log('\n❌ Get contacts test failed.');
  }
  
  console.log('\n=== TEST SUMMARY ===');
  console.log(`Connection: ${connectionTest ? '✅' : '❌'}`);
  console.log(`Table Structure: ${tableTest ? '✅' : '❌'}`);
  console.log(`Get Contacts: ${contactsTest ? '✅' : '❌'}`);
}

// Run the tests
runTests().catch(console.error); 