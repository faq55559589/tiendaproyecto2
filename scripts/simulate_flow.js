// Simulación de Flujo de Usuario - GolazoStore
console.log('🚀 Iniciando Simulación de Flujo de Usuario...\n');

async function simulateUserFlow() {
    const API_BASE = 'http://localhost:3000/api/products';

    try {
        // 1. Usuario entra al HOME (Carga de productos destacados)
        console.log('1️⃣  Usuario visita HOME: Cargando productos...');
        const homeRes = await fetch(API_BASE);
        const homeData = await homeRes.json();

        if (!homeData.success || homeData.products.length === 0) {
            throw new Error('❌ No se encontraron productos en el Home');
        }

        const product = homeData.products[0];
        console.log(`   ✅ Productos cargados: ${homeData.products.length}`);
        console.log(`   👀 Usuario ve: "${product.name}" ($${product.price})`);

        // 2. Usuario hace clic en "Ver Producto" (Carga detalle)
        console.log(`\n2️⃣  Usuario hace clic en el producto (ID: ${product.id})...`);
        const detailRes = await fetch(`${API_BASE}/${product.id}`);
        const detailData = await detailRes.json();

        if (!detailData.success) {
            throw new Error('❌ Error cargando detalle del producto');
        }

        const detail = detailData.product;
        console.log(`   ✅ Detalle cargado correctamente`);
        console.log(`   📦 Nombre: ${detail.name}`);
        console.log(`   💰 Precio: $${detail.price}`);
        console.log(`   🖼️  Imagen: ${detail.image_url}`);

        // 3. Verificando imagen
        console.log(`\n3️⃣  Verificando accesibilidad de la imagen...`);
        const imgRes = await fetch(detail.image_url, { method: 'HEAD' });

        if (imgRes.ok) {
            console.log(`   ✅ Imagen accesible (Status ${imgRes.status})`);
        } else {
            console.warn(`   ⚠️ La imagen no parece accesible (Status ${imgRes.status})`);
        }

        console.log('\n✨  ¡FLUJO COMPLETADO CON ÉXITO! ✨');

    } catch (error) {
        console.error('\n❌ ERROR EN LA SIMULACIÓN:', error.message);
        process.exit(1);
    }
}

simulateUserFlow();
