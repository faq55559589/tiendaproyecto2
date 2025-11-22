// ========================================
// GOLAZOSTORE - JavaScript para Página de Catálogo
// Funcionalidades de búsqueda
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    
    // ====================================
    // FUNCIONALIDAD DE BÚSQUEDA
    // ====================================
    
    function checkForSearchTerm() {
        const searchTerm = localStorage.getItem('searchTerm');
        
        if (searchTerm) {
            // Mostrar resultados de búsqueda
            showSearchResults(searchTerm);
            
            // Filtrar productos (simulación)
            filterProductsBySearch(searchTerm);
            
            // Limpiar término de búsqueda
            localStorage.removeItem('searchTerm');
        }
    }
    
    function showSearchResults(searchTerm) {
        const searchResultsDiv = document.getElementById('searchResults');
        const searchTermSpan = document.getElementById('searchTerm');
        const catalogTitle = document.getElementById('catalogTitle');
        
        if (searchResultsDiv && searchTermSpan) {
            searchTermSpan.textContent = `"${searchTerm}"`;
            searchResultsDiv.style.display = 'block';
            catalogTitle.textContent = `Resultados de búsqueda`;
        }
    }
    
    function filterProductsBySearch(searchTerm) {
        const productCards = document.querySelectorAll('.card');
        const searchLower = searchTerm.toLowerCase();
        let visibleCount = 0;
        
        productCards.forEach(card => {
            const titleElement = card.querySelector('.card-title');
            if (titleElement) {
                const title = titleElement.textContent.toLowerCase();
                
                if (title.includes(searchLower)) {
                    card.closest('.col-lg-3').style.display = 'block';
                    visibleCount++;
                } else {
                    card.closest('.col-lg-3').style.display = 'none';
                }
            }
        });
        
        // Mostrar mensaje si no hay resultados
        if (visibleCount === 0) {
            showNoResultsMessage(searchTerm);
        } else {
            updateResultsCount(visibleCount);
        }
    }
    
    function showNoResultsMessage(searchTerm) {
        const container = document.querySelector('.row');
        const noResultsDiv = document.createElement('div');
        noResultsDiv.className = 'col-12 text-center py-5';
        noResultsDiv.innerHTML = `
            <div class="card">
                <div class="card-body py-5">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h4 class="text-muted">No se encontraron resultados</h4>
                    <p class="text-muted mb-3">No hay productos que coincidan con "${searchTerm}"</p>
                    <button class="btn btn-danger" onclick="clearSearch()">
                        <i class="fas fa-arrow-left me-2"></i>Ver todos los productos
                    </button>
                </div>
            </div>
        `;
        container.appendChild(noResultsDiv);
    }
    
    function updateResultsCount(count) {
        const searchResultsDiv = document.getElementById('searchResults');
        if (searchResultsDiv) {
            const existingCount = searchResultsDiv.querySelector('.results-count');
            if (existingCount) {
                existingCount.remove();
            }
            
            const countElement = document.createElement('small');
            countElement.className = 'results-count d-block mt-2';
            countElement.innerHTML = `<i class="fas fa-info-circle me-1"></i>Se encontraron ${count} producto(s)`;
            searchResultsDiv.appendChild(countElement);
        }
    }
    
    // ====================================
    // FUNCIÓN GLOBAL PARA LIMPIAR BÚSQUEDA
    // ====================================
    
    window.clearSearch = function() {
        const searchResultsDiv = document.getElementById('searchResults');
        const catalogTitle = document.getElementById('catalogTitle');
        const productCards = document.querySelectorAll('.col-lg-3');
        
        // Ocultar alerta de búsqueda
        if (searchResultsDiv) {
            searchResultsDiv.style.display = 'none';
        }
        
        // Restaurar título
        if (catalogTitle) {
            catalogTitle.textContent = 'Nuestro Catálogo';
        }
        
        // Mostrar todos los productos
        productCards.forEach(card => {
            card.style.display = 'block';
        });
        
        // Remover mensaje de "no resultados"
        const noResultsDiv = document.querySelector('.no-results');
        if (noResultsDiv) {
            noResultsDiv.remove();
        }
    };

    // ====================================
    // INICIALIZACIÓN
    // ====================================
    
    checkForSearchTerm();

    console.log('✅ GolazoStore Catálogo: JavaScript cargado correctamente');
});


/* ====================================
   SISTEMA DE FILTRADO AVANZADO
   (Comentado para implementación futura)
   ====================================

// Base de datos de productos mejorada con categorías, talles y stock
const productsDatabase = [
    {
        id: 1,
        name: 'Camiseta Selección Local',
        price: 89.99,
        category: 'seleccion',
        sizes: ['S', 'M', 'L', 'XL'],
        image: 'https://placehold.co/300x300/E8E8E8/000000?text=Camiseta+1',
        dateAdded: new Date('2024-12-01'),
        stock: 15
    },
    // ... más productos
];

// Funciones de filtrado:
// - applyFilters() - Aplica filtros por categoría, precio y talle
// - applySorting() - Ordena por precio, nombre o fecha
// - switchView() - Cambia entre vista grid y lista
// - renderProducts() - Renderiza productos dinámicamente

*/ 
