// Native fetch in Node 18+

async function testForgot() {
    const email = 'facundonew2003@gmail.com'; // Replace with a known email in your DB if possible, or use one created
    console.log(`Testing forgot-password for: ${email}`);

    try {
        const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', data);
    } catch (e) {
        console.error('Error:', e);
    }
}

testForgot();
