// EmailJS test script
require('dotenv').config();

// Simulate browser environment for EmailJS
global.window = {};
global.navigator = {};

// Import EmailJS
const emailjs = require('@emailjs/browser');

async function testEmailJS() {
  console.log('=== TESTING EMAILJS ===');
  
  try {
    // Initialize EmailJS
    const publicKey = '8ebA--sjSPqBP4A9N';
    emailjs.init(publicKey);
    console.log('✅ EmailJS initialized');
    
    // Test email parameters
    const templateParams = {
      to_email: 'andybaronca@gmail.com',
      from_name: 'Family Law Assistant',
      question: 'Test email from debug script',
      answer: 'This is a test email to verify EmailJS is working properly.',
      timestamp: new Date().toLocaleString(),
      record_id: 'test-123',
      original_email: 'test@example.com'
    };
    
    console.log('Template params:', templateParams);
    
    // Send test email
    const result = await emailjs.send(
      'service_v3epzv2', 
      'template_fuz4031', 
      templateParams
    );
    
    console.log('✅ Email sent successfully!');
    console.log('Result:', result);
    return true;
  } catch (error) {
    console.error('❌ EmailJS test failed:', error);
    console.error('Error details:', error.message);
    return false;
  }
}

async function runEmailTest() {
  console.log('Starting EmailJS test...\n');
  
  const emailTest = await testEmailJS();
  
  console.log('\n=== EMAIL TEST SUMMARY ===');
  console.log(`EmailJS: ${emailTest ? '✅' : '❌'}`);
}

// Run the test
runEmailTest().catch(console.error); 