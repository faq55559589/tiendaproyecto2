// Test API endpoint
console.log('🧪 Testing GolazoStore API...\n');

async function testAPI() {
    try {
        const response = await fetch('http://localhost:3000/api/products');
        const data = await response.json();

        console.log('✅ API Response:', response.status);
        console.log('✅ Data:', JSON.stringify(data, null, 2));

        if (data.success && data.products.length > 0) {
            console.log('\n🎯 Products found:', data.products.length);
            data.products.forEach(p => {
                console.log(`  - ${p.name} ($${p.price})`);
                console.log(`    Image: ${p.image_url}`);
            });
        } else {
            console.log('⚠️ No products found');
        }
    } catch (e) {
        console.error('❌ Error:', e.message);
        console.log('\n💡 Make sure the backend server is running:');
        console.log('   cd backend && node server.js');
    }
}

testAPI();
