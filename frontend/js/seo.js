(function () {
    const BRAND_NAME = 'Golazo FutStore';
    const BRAND_HANDLE = 'golazofutstore';
    const DEFAULT_IMAGE = 'assets/images/logo.png';

    function getSiteUrl() {
        const { origin, hostname } = window.location;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return `${origin}/frontend`;
        }
        return origin;
    }

    function absoluteUrl(path) {
        return new URL(path, `${getSiteUrl()}/`).toString();
    }

    function upsertMeta(selector, attributes) {
        let element = document.head.querySelector(selector);
        if (!element) {
            element = document.createElement('meta');
            document.head.appendChild(element);
        }

        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
    }

    function setCanonical(path) {
        let canonical = document.head.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.setAttribute('rel', 'canonical');
            document.head.appendChild(canonical);
        }
        canonical.setAttribute('href', absoluteUrl(path));
    }

    function setJsonLd(id, payload) {
        let script = document.getElementById(id);
        if (!script) {
            script = document.createElement('script');
            script.type = 'application/ld+json';
            script.id = id;
            document.head.appendChild(script);
        }
        script.textContent = JSON.stringify(payload);
    }

    function setCommonMeta({ title, description, path, image, type }) {
        document.title = title;
        setCanonical(path);
        upsertMeta('meta[name="description"]', { name: 'description', content: description });
        upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title });
        upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
        upsertMeta('meta[property="og:url"]', { property: 'og:url', content: absoluteUrl(path) });
        upsertMeta('meta[property="og:image"]', { property: 'og:image', content: absoluteUrl(image || DEFAULT_IMAGE) });
        upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: BRAND_NAME });
        upsertMeta('meta[property="og:type"]', { property: 'og:type', content: type || 'website' });
        upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
        upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
        upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: absoluteUrl(image || DEFAULT_IMAGE) });
    }

    function applyOrganizationSchema() {
        setJsonLd('golazo-org-schema', {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: BRAND_NAME,
            alternateName: BRAND_HANDLE,
            url: getSiteUrl(),
            logo: absoluteUrl(DEFAULT_IMAGE),
            sameAs: [
                'https://www.instagram.com/golazofutstore_/'
            ],
            contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'customer support',
                areaServed: 'UY',
                availableLanguage: ['es']
            }
        });
    }

    function applyWebSiteSchema() {
        setJsonLd('golazo-website-schema', {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: BRAND_NAME,
            alternateName: BRAND_HANDLE,
            url: getSiteUrl()
        });
    }

    function applyCatalogSeo({ category, search, total }) {
        const queryText = String(search || '').trim();
        const categoryText = String(category || '').trim();
        let title = `Catalogo de camisetas de futbol | ${BRAND_NAME}`;
        let description = 'Explora camisetas de futbol de clubes, selecciones y modelos retro disponibles en Golazo FutStore.';

        if (categoryText) {
            title = `${categoryText} | Catalogo de camisetas | ${BRAND_NAME}`;
            description = `Explora camisetas de ${categoryText} en Golazo FutStore. Revisa modelos disponibles, precio, stock y talles.`;
        }

        if (queryText) {
            title = `${queryText} | Buscar camisetas | ${BRAND_NAME}`;
            description = `Resultados para ${queryText} en Golazo FutStore. Actualmente mostramos ${total} producto(s) relacionados.`;
        }

        const path = window.location.pathname.split('/').pop() + window.location.search;
        setCommonMeta({
            title,
            description,
            path
        });
    }

    function applyProductSeo(product) {
        const productName = String(product.name || 'Producto');
        const description = String(product.description || 'Consulta precio, stock, talles e imagenes de esta camiseta de futbol en Golazo FutStore.')
            .trim()
            .slice(0, 160);
        const path = `producto.html?id=${encodeURIComponent(product.id)}`;

        setCommonMeta({
            title: `${productName} | ${BRAND_NAME}`,
            description,
            path,
            image: product.image_url,
            type: 'product'
        });

        setJsonLd('golazo-product-schema', {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: productName,
            image: (product.image_urls || [product.image_url]).filter(Boolean),
            description,
            brand: {
                '@type': 'Brand',
                name: BRAND_NAME
            },
            offers: {
                '@type': 'Offer',
                priceCurrency: 'UYU',
                price: Number(product.price || 0),
                availability: Number(product.stock || 0) > 0
                    ? 'https://schema.org/InStock'
                    : 'https://schema.org/OutOfStock',
                url: absoluteUrl(path)
            }
        });
    }

    function initDefaultSeo() {
        applyOrganizationSchema();
        applyWebSiteSchema();

        const page = window.location.pathname.split('/').pop() || 'home.html';
        if (page === 'home.html') {
            setCommonMeta({
                title: `${BRAND_NAME} | Camisetas de futbol en Uruguay`,
                description: 'Golazo FutStore es una tienda online de camisetas de futbol en Uruguay con catalogo de clubes, selecciones y modelos retro.',
                path: 'home.html'
            });
        } else if (page === 'contacto.html') {
            setCommonMeta({
                title: `Contacto | ${BRAND_NAME}`,
                description: 'Contacta a Golazo FutStore para consultar stock, talles, entregas y encargos de camisetas de futbol en Uruguay.',
                path: 'contacto.html'
            });
        } else if (page === 'catalogo.html') {
            applyCatalogSeo({ category: '', search: '', total: 0 });
        }
    }

    document.addEventListener('DOMContentLoaded', initDefaultSeo);

    window.GolazoSEO = {
        applyCatalogSeo,
        applyProductSeo
    };
})();
