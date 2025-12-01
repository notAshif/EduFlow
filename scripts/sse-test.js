// scripts/sse-test.js
// Simple SSE test script to verify real-time events
// Run with: node scripts/sse-test.js

const EventSource = require('eventsource');

console.log('🔌 Connecting to SSE stream...\n');

const es = new EventSource('http://localhost:3000/api/dashboard/stream');

es.onopen = () => {
    console.log('✅ Connected to SSE stream\n');
};

es.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        console.log('📨 Received event:');
        console.log(JSON.stringify(data, null, 2));
        console.log('');
    } catch (error) {
        console.log('📨 Raw message:', event.data);
    }
};

es.onerror = (error) => {
    console.error('❌ SSE Error:', error.message || error);
    console.log('\n💡 Make sure the dev server is running on http://localhost:3000');
    console.log('💡 And you are authenticated (logged in via Clerk)\n');
};

console.log('👂 Listening for events... (Press Ctrl+C to exit)\n');
console.log('💡 Trigger a test run in another terminal:');
console.log('   curl -X POST http://localhost:3000/api/dashboard/trigger-run \\');
console.log('     -H "Content-Type: application/json" \\');
console.log('     -d \'{"status": "SUCCESS"}\'');
console.log('');

// Keep the script running
process.on('SIGINT', () => {
    console.log('\n\n👋 Closing connection...');
    es.close();
    process.exit(0);
});
