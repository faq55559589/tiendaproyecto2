-- Base de datos GolazoStore (SQLite version)
-- Crear tablas

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    newsletter INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
 
-- Tabla de categorías
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    image_url TEXT,
    stock INTEGER DEFAULT 0,
    sizes TEXT,
    category_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Tabla de carrito
CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    size TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Tabla de pedidos
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    total REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    shipping_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabla de items de pedidos
CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    size TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Insertar categorías iniciales
INSERT INTO categories (name, description) VALUES 
('Retro', 'Camisetas clásicas e históricas de fútbol'),
('Actuales', 'Camisetas de la temporada actual'),
('Selecciones', 'Camisetas de selecciones nacionales'),
('Clubes', 'Camisetas de clubes europeos y sudamericanos');

-- Insertar productos de ejemplo
INSERT INTO products (name, description, price, image_url, stock, sizes, category_id) VALUES 
('Argentina 1986 Retro', 'Camiseta retro de Argentina campeona del mundo 1986. Diseño clásico con el mítico 10 de Maradona.', 4500.00, 'argentina-1986.jpg', 15, '["S", "M", "L", "XL"]', 1),
('Brasil 1970 Retro', 'Camiseta legendaria de Brasil tricampeón del mundo. El amarillo que hizo historia con Pelé.', 4200.00, 'brasil-1970.jpg', 12, '["M", "L", "XL"]', 1),
('Manchester United 1999', 'Camiseta del histórico triplete del Manchester United. Sharp patrocinador.', 3800.00, 'manutd-1999.jpg', 8, '["S", "M", "L", "XL", "XXL"]', 1),
('Real Madrid 2024', 'Camiseta oficial del Real Madrid temporada 2024. Diseño blanco con detalles dorados.', 5500.00, 'realmadrid-2024.jpg', 25, '["S", "M", "L", "XL"]', 2),
('Barcelona 2024', 'Camiseta del FC Barcelona temporada 2024. Blaugrana con sponsor Spotify.', 5500.00, 'barcelona-2024.jpg', 20, '["S", "M", "L", "XL", "XXL"]', 2),
('Uruguay 2024', 'Camiseta celeste de la selección de Uruguay. Diseño actual con las 4 estrellas.', 4800.00, 'uruguay-2024.jpg', 18, '["S", "M", "L", "XL"]', 3),
('Argentina 2024', 'Camiseta campeona del mundo. Diseño con 3 estrellas y escudo AFA.', 5200.00, 'argentina-2024.jpg', 30, '["S", "M", "L", "XL", "XXL"]', 3),
('AC Milan 1994 Retro', 'Camiseta histórica del Milan de los 90. Diseño rossonero clásico.', 3900.00, 'milan-1994.jpg', 10, '["M", "L", "XL"]', 1),
('Liverpool 2024', 'Camiseta del Liverpool FC temporada 2024. Rojo intenso con sponsor Standard Chartered.', 5300.00, 'liverpool-2024.jpg', 22, '["S", "M", "L", "XL"]', 2),
('Boca Juniors 2024', 'Camiseta xeneize con el clásico azul y oro. Sponsor Qatar Airways.', 4600.00, 'boca-2024.jpg', 28, '["S", "M", "L", "XL", "XXL"]', 4),
('River Plate 2024', 'Camiseta millonaria con banda roja diagonal. Diseño actual.', 4600.00, 'river-2024.jpg', 26, '["S", "M", "L", "XL"]', 4),
('Peñarol 1987 Retro', 'Camiseta histórica del Peñarol campeón de América. Aurinegra clásica.', 3700.00, 'peñarol-1987.jpg', 14, '["M", "L", "XL"]', 1),
('Nacional 2024', 'Camiseta tricolor de Nacional. Diseño moderno con los tres colores tradicionales.', 4400.00, 'nacional-2024.jpg', 16, '["S", "M", "L", "XL"]', 4),
('PSG 2024', 'Camiseta del Paris Saint-Germain. Azul con franja roja y sponsor Jordan.', 5800.00, 'psg-2024.jpg', 19, '["S", "M", "L", "XL", "XXL"]', 2),
('Inter Miami 2024', 'Camiseta rosa del Inter Miami con el 10 de Messi. Edición especial MLS.', 6000.00, 'inter-miami-2024.jpg', 35, '["S", "M", "L", "XL", "XXL"]', 2);
