document.addEventListener('DOMContentLoaded', async function () {
    const params = new URLSearchParams(window.location.search);
    const productId = Number(params.get('id'));

    if (!productId) {
        window.location.href = GolazoStore.paths.catalog();
        return;
    }

    const dom = {
        section: document.querySelector('.product-section'),
        title: document.querySelector('.product-title'),
        price: document.querySelector('.current-price'),
        originalPrice: document.querySelector('.original-price'),
        discountBadge: document.querySelector('.discount-badge'),
        rating: document.querySelector('.product-rating'),
        lead: document.querySelector('.product-description .lead'),
        bodyText: document.querySelector('#description p'),
        mainImage: document.getElementById('mainImage'),
        galleryPrev: document.getElementById('galleryPrev'),
        galleryNext: document.getElementById('galleryNext'),
        breadcrumbs: document.querySelector('.breadcrumb-item.active'),
        stock: document.getElementById('stockCount'),
        quantityInput: document.getElementById('quantityInput'),
        addButton: document.getElementById('addToCartBtn'),
        buyButton: document.getElementById('buyNowBtn'),
        sizesWrap: document.querySelector('.size-options'),
        specsList: document.querySelector('.product-specs ul'),
        specsTab: document.querySelector('#specifications .p-4'),
        relatedSection: document.getElementById('relatedProductsSection'),
        relatedContainer: document.getElementById('relatedProductsContainer'),
        reviewsTabBtn: document.getElementById('reviews-tab'),
        reviewsPane: document.getElementById('reviews'),
        metaChips: document.getElementById('productMetaChips')
    };

    let product;
    let galleryImages = [];
    let activeImageIndex = 0;
    let reviewsState = {
        reviews: [],
        summary: { total_reviews: 0, average_rating: 0, distribution: {} },
        permissions: null
    };
    const esc = GolazoStore.escapeHtml;
    const attr = GolazoStore.escapeAttr;

    function formatDescription(product) {
        const rawDescription = String(product.description || '').trim();
        if (rawDescription) {
            return {
                lead: rawDescription,
                bodyHtml: `<p class="mb-0">${esc(rawDescription)}</p>`
            };
        }

        return {
            lead: 'Una camiseta lista para revisar talles, stock y compra desde la misma ficha.',
            bodyHtml: `
                <p class="mb-3">Esta ficha prioriza lo importante para decidir rapido: imagenes, talles, stock y precio.</p>
                <p class="mb-0">Si buscas un modelo parecido o necesitas confirmar detalles, puedes avanzar a compra y continuar el seguimiento desde tu pedido.</p>
            `
        };
    }

    function buildSpecs(product) {
        const specs = [];
        specs.push(['Categoría', GolazoStore.getCategoryLabel(product)]);
        specs.push(['Stock', String(product.stock)]);
        specs.push(['Talles', product.sizes.join(', ')]);

        if (product.specifications) {
            try {
                const parsed = JSON.parse(product.specifications);
                Object.entries(parsed).forEach(([key, value]) => specs.push([key, String(value)]));
            } catch (error) {
                const lines = String(product.specifications)
                    .split(/\r?\n/)
                    .map((line) => line.trim())
                    .filter(Boolean);

                if (lines.length > 1) {
                    lines.forEach((line, index) => specs.push([index === 0 ? 'Detalle' : 'Info adicional', line]));
                } else {
                    specs.push(['Detalles', String(product.specifications)]);
                }
            }
        }

        return specs;
    }

    try {
        product = await GolazoStore.getProduct(productId);
        renderProduct(product);
        await loadReviews(product.id);
        loadRelated(product.id);
        } catch (error) {
            dom.section.innerHTML = `
                <div class="container text-center py-5">
                    <i class="fas fa-circle-xmark fa-3x text-danger mb-3"></i>
                <h3>Producto no encontrado</h3>
                <a href="catalogo.html" class="btn btn-danger mt-3">Volver al catálogo</a>
            </div>
        `;
    }

    function renderProduct(product) {
        const description = formatDescription(product);
        const specs = buildSpecs(product);
        dom.title.textContent = product.name;
        dom.price.textContent = GolazoStore.formatPrice(product.price);
        dom.lead.textContent = description.lead;
        if (dom.bodyText) {
            dom.bodyText.parentElement.innerHTML = description.bodyHtml;
        }
        dom.mainImage.src = product.image_url;
        dom.mainImage.alt = product.name;
        dom.breadcrumbs.textContent = product.name;
        dom.stock.textContent = product.stock;
        document.title = `${product.name} | Golazo FutStore`;

        if (window.GolazoSEO) {
            window.GolazoSEO.applyProductSeo(product);
        }

        if (dom.originalPrice) dom.originalPrice.remove();
        if (dom.discountBadge) dom.discountBadge.remove();
        if (dom.rating) {
            dom.rating.innerHTML = `<span class="text-ui-muted small"><i class="fas fa-circle-info icon-accent me-2"></i>${product.stock > 0 ? 'Disponible para compra inmediata.' : 'Actualmente sin stock disponible.'}</span>`;
        }
        if (dom.metaChips) {
            dom.metaChips.innerHTML = `
                <span class="badge badge-soft-brand px-3 py-2">${esc(GolazoStore.getCategoryLabel(product))}</span>
                <span class="badge ${product.stock > 0 ? 'badge-soft-success' : 'badge-soft-danger'} px-3 py-2">${product.stock > 0 ? `Stock ${product.stock}` : 'Sin stock'}</span>
                <span class="badge badge-soft-neutral px-3 py-2">${esc((product.sizes || []).join(' / ') || 'Talle unico')}</span>
            `;
        }
        if (dom.reviewsTabBtn) {
            dom.reviewsTabBtn.textContent = 'Reseñas';
        }
        if (dom.reviewsPane) {
            dom.reviewsPane.innerHTML = `
                <div class="p-4 text-center">
                    <div class="surface-note border-0 p-4">
                        <i class="fas fa-comments fa-2x icon-accent mb-3"></i>
                        <p class="mb-0 text-ui-muted">Cargando reseñas reales de compradores.</p>
                    </div>
                </div>
            `;
        }

        renderSizes(product.sizes);
        renderSpecifications(specs);

        setupGallery(product);

        dom.addButton.disabled = product.stock < 1;
        dom.buyButton.disabled = product.stock < 1;
        if (product.stock < 1) {
            dom.addButton.textContent = 'Sin stock';
            dom.buyButton.textContent = 'No disponible';
        }
    }

    function setupGallery(product) {
        const normalized = Array.isArray(product.image_urls) ? product.image_urls : [product.image_url];
        galleryImages = normalized
            .map((url) => String(url || '').trim())
            .filter(Boolean)
            .filter((url, index, array) => array.indexOf(url) === index);
        if (!galleryImages.length) {
            galleryImages = [product.image_url];
        }
        activeImageIndex = 0;
        renderGallery();
    }

    function renderGallery() {
        const thumbnails = document.querySelector('.thumbnail-gallery');
        const currentImage = galleryImages[activeImageIndex] || product.image_url;
        dom.mainImage.src = currentImage;
        dom.mainImage.alt = product.name;
        dom.mainImage.onerror = function () {
            this.onerror = null;
            this.src = product.image_url;
        };

        if (thumbnails) {
            thumbnails.innerHTML = galleryImages.map((imageUrl, index) => `
                <button type="button" class="thumbnail-item border-0 bg-transparent p-0 ${index === activeImageIndex ? 'active' : ''}" data-image-index="${index}" aria-label="Ver imagen ${index + 1}">
                    <img src="${attr(imageUrl)}" class="img-thumbnail thumbnail-img" alt="${esc(product.name)} ${index + 1}" loading="lazy">
                </button>
            `).join('');
        }

        const hasMultipleImages = galleryImages.length > 1;
        if (dom.galleryPrev) {
            dom.galleryPrev.disabled = !hasMultipleImages;
            dom.galleryPrev.style.display = hasMultipleImages ? 'grid' : 'none';
        }
        if (dom.galleryNext) {
            dom.galleryNext.disabled = !hasMultipleImages;
            dom.galleryNext.style.display = hasMultipleImages ? 'grid' : 'none';
        }
    }

    function moveGallery(direction) {
        if (galleryImages.length <= 1) return;
        activeImageIndex = (activeImageIndex + direction + galleryImages.length) % galleryImages.length;
        renderGallery();
    }

    function renderSizes(sizes) {
        if (!dom.sizesWrap) return;
        dom.sizesWrap.innerHTML = sizes.map((size, index) => `
            <button class="btn btn-outline-secondary size-btn ${index === 0 ? 'active' : ''}" data-size="${esc(size)}">${esc(size)}</button>
        `).join('');

        dom.sizesWrap.querySelectorAll('.size-btn').forEach((button) => {
            button.addEventListener('click', function () {
                dom.sizesWrap.querySelectorAll('.size-btn').forEach((item) => item.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }

    function renderSpecifications(specs) {
        if (dom.specsList) {
            dom.specsList.innerHTML = specs.slice(0, 5).map(([key, value]) => `
                <li class="spec-item"><i class="fas fa-check icon-accent"></i> <strong class="spec-key">${esc(key)}:</strong> <span class="spec-value">${esc(value)}</span></li>
            `).join('');
        }

        if (dom.specsTab) {
            dom.specsTab.innerHTML = `
                <h5 class="spec-title">Especificaciones reales</h5>
                    <div class="table-responsive">
                        <table class="table table-striped mb-0 specs-table">
                            <tbody>
                            ${specs.map(([key, value]) => `<tr><td class="spec-key">${esc(key)}</td><td class="spec-value">${esc(value)}</td></tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
        }
    }

    function formatDate(dateValue) {
        if (!dateValue) return '';
        const parsed = new Date(String(dateValue).replace(' ', 'T'));
        if (Number.isNaN(parsed.getTime())) return '';
        return new Intl.DateTimeFormat('es-UY', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).format(parsed);
    }

    function renderStars(rating) {
        const normalized = Math.max(0, Math.min(5, Number(rating || 0)));
        return Array.from({ length: 5 }, (_, index) => (
            `<i class="fa-star ${index < normalized ? 'fas text-warning' : 'far text-muted'}"></i>`
        )).join('');
    }

    function getPermissionMessage(permissions) {
        if (!permissions) return 'Estamos verificando tus permisos para participar.';
        if (permissions.canReview || permissions.canComment) {
            return 'Ya puedes dejar tu experiencia si la compra fue confirmada.';
        }
        return permissions.reason || 'Solo compradores verificados pueden participar.';
    }

    function buildReviewSummary(summary) {
        const total = Number(summary?.total_reviews || 0);
        const avg = Number(summary?.average_rating || 0);
        return `
            <div class="review-summary-grid mb-4">
                <div class="review-summary-card">
                    <span class="review-summary-card__eyebrow">Promedio</span>
                    <div class="review-summary-card__value">${total ? avg.toFixed(1) : '-'}</div>
                    <div class="review-stars">${renderStars(Math.round(avg))}</div>
                </div>
                <div class="review-summary-card">
                    <span class="review-summary-card__eyebrow">Qué significan</span>
                    <p class="mb-2 review-summary-card__text">Estas reseñas vienen solo de compras confirmadas o entregadas.</p>
                    <p class="mb-0 text-ui-muted small">${total ? `Ya hay ${total} experiencia(s) publicadas.` : 'Todavía no hay experiencias publicadas.'}</p>
                </div>
            </div>
        `;
    }

    function buildReviewForm(permissions) {
        if (!GolazoAuth.isLoggedIn()) {
            return `
                <div class="review-gate surface-note">
                    <strong class="d-block mb-2">Inicia sesión para participar</strong>
                    <p class="mb-3 text-ui-muted">Las reseñas y comentarios están reservados para compradores verificados.</p>
                    <a href="${GolazoStore.paths.login()}" class="btn btn-danger btn-sm">Ir a login</a>
                </div>
            `;
        }

        if (!permissions?.canReview && !permissions?.existingReviewId) {
            return `
                <div class="review-gate surface-note">
                    <strong class="d-block mb-2">Reseña bloqueada por ahora</strong>
                    <p class="mb-0 text-ui-muted">${esc(getPermissionMessage(permissions))}</p>
                </div>
            `;
        }

        return `
            <form id="reviewForm" class="review-form">
                <div class="review-form__header">
                    <div>
                        <h3 class="h5 mb-1">Deja tu reseña</h3>
                        <p class="mb-0 text-ui-muted small">Una reseña por comprador. Luego puedes editarla.</p>
                    </div>
                    <div class="review-rating-input" role="group" aria-label="Puntuación">
                        ${[5, 4, 3, 2, 1].map((value) => `
                            <label class="review-star-choice ${value === 5 ? 'is-selected' : ''}" data-rating-value="${value}" aria-label="${value} estrella(s)">
                                <input type="radio" name="rating" value="${value}" ${value === 5 ? 'checked' : ''}>
                                <i class="fas fa-star"></i>
                            </label>
                        `).join('')}
                    </div>
                </div>
                <div class="mb-3">
                    <label for="reviewBody" class="form-label">Tu experiencia</label>
                    <textarea id="reviewBody" name="body" class="form-control" rows="4" maxlength="600" placeholder="Cuenta cómo fue la compra, la calidad o el calce."></textarea>
                </div>
                <div class="d-flex flex-wrap gap-2 align-items-center">
                    <button type="submit" class="btn btn-danger" id="reviewSubmitBtn">${permissions?.existingReviewId ? 'Guardar cambios' : 'Publicar reseña'}</button>
                    <span class="small text-ui-muted" id="reviewFormStatus">${permissions?.existingReviewId ? 'Ya tienes una reseña publicada.' : 'Tu reseña quedará visible en esta ficha.'}</span>
                </div>
            </form>
        `;
    }

    function buildCommentForm(reviewId, permissions) {
        if (!permissions?.canComment) return '';
        return `
            <form class="review-comment-form mt-3" data-review-comment-form="${reviewId}">
                <div class="input-group">
                    <input type="text" class="form-control" name="body" maxlength="400" placeholder="Aporta más contexto sobre tu compra">
                    <button class="btn btn-outline-brand" type="submit">Comentar</button>
                </div>
            </form>
        `;
    }

    function buildCommentItem(comment) {
        const currentUser = GolazoAuth.getCurrentUser();
        const canManage = currentUser && Number(currentUser.id) === Number(comment.user_id);
        const authorName = `${comment.author?.first_name || ''} ${comment.author?.last_name || ''}`.trim() || 'Comprador';
        return `
            <article class="review-comment-item">
                <div class="d-flex gap-3">
                    <div class="review-avatar-wrap">
                        ${GolazoStore.renderAvatarMarkup(comment.author, { className: 'review-author-avatar', size: 42, alt: `Avatar de ${authorName}` })}
                    </div>
                    <div class="flex-grow-1">
                        <div class="d-flex flex-wrap justify-content-between gap-2 align-items-start">
                            <div>
                                <strong>${esc(authorName)}</strong>
                                <div class="small text-ui-muted">${esc(formatDate(comment.created_at))}</div>
                            </div>
                            ${canManage ? `
                                <div class="d-flex gap-2">
                                    <button type="button" class="btn btn-link btn-sm p-0" data-edit-comment-id="${comment.id}" data-comment-body="${attr(comment.body)}">Editar</button>
                                    <button type="button" class="btn btn-link btn-sm text-danger p-0" data-delete-comment-id="${comment.id}">Eliminar</button>
                                </div>
                            ` : ''}
                        </div>
                        <p class="mb-0 mt-2">${esc(comment.body)}</p>
                    </div>
                </div>
            </article>
        `;
    }

    function buildReviewItem(review, permissions) {
        const currentUser = GolazoAuth.getCurrentUser();
        const isOwner = currentUser && Number(currentUser.id) === Number(review.user_id);
        const authorName = `${review.author?.first_name || ''} ${review.author?.last_name || ''}`.trim() || 'Comprador';
        return `
            <article class="review-thread-card">
                <div class="d-flex gap-3 align-items-start">
                    <div class="review-avatar-wrap">
                        ${GolazoStore.renderAvatarMarkup(review.author, { className: 'review-author-avatar', size: 52, alt: `Avatar de ${authorName}` })}
                    </div>
                    <div class="flex-grow-1">
                        <div class="d-flex flex-wrap justify-content-between gap-2 align-items-start">
                            <div>
                                <div class="d-flex flex-wrap align-items-center gap-2 mb-1">
                                    <strong>${esc(authorName)}</strong>
                                    <span class="badge badge-soft-success">Compra verificada</span>
                                </div>
                                <div class="review-stars mb-2">${renderStars(review.rating)}</div>
                                <div class="small text-ui-muted">${esc(formatDate(review.created_at))}</div>
                            </div>
                            ${isOwner ? `
                                <div class="d-flex gap-2">
                                    <button type="button" class="btn btn-outline-brand btn-sm" data-edit-review-id="${review.id}">Editar</button>
                                    <button type="button" class="btn btn-link btn-sm text-danger p-0" data-delete-review-id="${review.id}">Eliminar</button>
                                </div>
                            ` : ''}
                        </div>
                        <p class="review-thread-card__body mb-0 mt-3">${esc(review.body)}</p>
                        <div class="review-comments-list mt-4">
                            ${review.comments?.length ? review.comments.map(buildCommentItem).join('') : '<p class="small text-ui-muted mb-0">Todavía no hay comentarios en este hilo.</p>'}
                        </div>
                        ${buildCommentForm(review.id, permissions)}
                    </div>
                </div>
            </article>
        `;
    }

    function renderReviews() {
        if (!dom.reviewsPane) return;

        const { reviews, summary, permissions } = reviewsState;
        dom.reviewsPane.innerHTML = `
            <div class="p-4 p-lg-5">
                ${buildReviewSummary(summary)}
                <div class="review-layout">
                    <div>
                        <div class="review-info-card mb-4">
                            <div class="d-flex align-items-start justify-content-between gap-3">
                                <div>
                                    <h3 class="h5 mb-1">Opiniones de compradores</h3>
                                    <p class="mb-0 text-ui-muted">${esc(getPermissionMessage(permissions))}</p>
                                </div>
                                <span class="badge badge-soft-brand">${Number(summary?.total_reviews || 0)} reseña(s)</span>
                            </div>
                        </div>
                        <div id="reviewsList">
                            ${reviews.length ? reviews.map((review) => buildReviewItem(review, permissions)).join('') : `
                                <div class="review-empty-state surface-note text-center">
                                    <i class="fas fa-comment-slash fa-2x icon-accent mb-3"></i>
                                    <p class="mb-0 text-ui-muted">Todavía no hay reseñas publicadas para este producto.</p>
                                </div>
                            `}
                        </div>
                    </div>
                    <aside>
                        ${buildReviewForm(permissions)}
                    </aside>
                </div>
            </div>
        `;

        const existingReview = permissions?.existingReviewId
            ? reviews.find((review) => Number(review.id) === Number(permissions.existingReviewId))
            : null;
        const form = dom.reviewsPane.querySelector('#reviewForm');
        if (existingReview && form) {
            form.querySelector('#reviewBody').value = existingReview.body || '';
            const ratingInput = form.querySelector(`input[name="rating"][value="${existingReview.rating}"]`);
            if (ratingInput) {
                ratingInput.checked = true;
            }
            syncRatingChoices(form);
        } else if (form) {
            syncRatingChoices(form);
        }
    }

    async function loadReviews(currentProductId) {
        try {
            const data = await GolazoStore.api(`/reviews/product/${currentProductId}`);
            reviewsState = {
                reviews: data.reviews || [],
                summary: data.summary || { total_reviews: 0, average_rating: 0, distribution: {} },
                permissions: data.permissions || null
            };
            renderReviews();
        } catch (error) {
            if (dom.reviewsPane) {
                dom.reviewsPane.innerHTML = `
                    <div class="p-4">
                        <div class="alert alert-danger mb-0">No se pudieron cargar las reseñas.</div>
                    </div>
                `;
            }
        }
    }

    async function submitReview(reviewId, payload) {
        const endpoint = reviewId ? `/reviews/${reviewId}` : `/reviews/product/${product.id}`;
        const method = reviewId ? 'PUT' : 'POST';
        await GolazoStore.api(endpoint, {
            method,
            body: JSON.stringify(payload)
        }, true);
        await loadReviews(product.id);
    }

    async function deleteReview(reviewId) {
        await GolazoStore.api(`/reviews/${reviewId}`, { method: 'DELETE' }, true);
        await loadReviews(product.id);
    }

    async function submitComment(reviewId, body) {
        await GolazoStore.api(`/reviews/${reviewId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ body })
        }, true);
        await loadReviews(product.id);
    }

    async function deleteComment(commentId) {
        await GolazoStore.api(`/reviews/comments/${commentId}`, { method: 'DELETE' }, true);
        await loadReviews(product.id);
    }

    async function updateComment(commentId, body) {
        await GolazoStore.api(`/reviews/comments/${commentId}`, {
            method: 'PUT',
            body: JSON.stringify({ body })
        }, true);
        await loadReviews(product.id);
    }

    function syncRatingChoices(form) {
        if (!form) return;
        const checkedValue = Number(form.querySelector('input[name="rating"]:checked')?.value || 0);
        form.querySelectorAll('[data-rating-value]').forEach((choice) => {
            choice.classList.toggle('is-selected', Number(choice.dataset.ratingValue) <= checkedValue);
        });
    }

    async function loadRelated(currentId) {
        try {
            const products = await GolazoStore.getProducts();
            const related = products.filter((item) => item.id !== currentId).slice(0, 4);
            if (!related.length) {
                dom.relatedSection.style.display = 'none';
                return;
            }
            dom.relatedSection.style.display = 'block';
            dom.relatedContainer.innerHTML = related.map((item) => `
                <div class="col-lg-3 col-md-6 mb-4">
                    <article class="card product-card product-card--related h-100 border-0 shadow-sm">
                        <a href="${GolazoStore.paths.product(item.id)}"><img src="${attr(item.image_url)}" class="card-img-top" alt="${esc(item.name)}" style="height: 240px; object-fit: cover;"></a>
                        <div class="card-body text-center d-flex flex-column">
                            <h3 class="h6">${esc(item.name)}</h3>
                            <p class="fw-bold text-price-accent mb-3">${GolazoStore.formatPrice(item.price)}</p>
                            <a class="btn btn-outline-brand btn-sm mt-auto" href="${GolazoStore.paths.product(item.id)}">Ver producto</a>
                        </div>
                    </article>
                </div>
            `).join('');
        } catch (error) {
            dom.relatedSection.style.display = 'none';
        }
    }

    document.getElementById('increaseQty')?.addEventListener('click', function () {
        const current = Number(dom.quantityInput.value || 1);
        if (current < product.stock) dom.quantityInput.value = current + 1;
    });

    document.getElementById('decreaseQty')?.addEventListener('click', function () {
        const current = Number(dom.quantityInput.value || 1);
        if (current > 1) dom.quantityInput.value = current - 1;
    });

    document.querySelector('.thumbnail-gallery')?.addEventListener('click', function (event) {
        const thumbnail = event.target.closest('[data-image-index]');
        if (!thumbnail) return;
        activeImageIndex = Number(thumbnail.dataset.imageIndex);
        renderGallery();
    });

    dom.galleryPrev?.addEventListener('click', function () {
        moveGallery(-1);
    });

    dom.galleryNext?.addEventListener('click', function () {
        moveGallery(1);
    });

    dom.addButton?.addEventListener('click', async function () {
        const size = document.querySelector('.size-btn.active')?.dataset.size || product.sizes[0] || 'M';
        const quantity = Math.min(Number(dom.quantityInput.value || 1), product.stock || 1);
        try {
            await GolazoStore.cart.add(product, quantity, size);
            GolazoStore.ui.toast('Producto agregado al carrito.', 'success');
        } catch (error) {
            GolazoStore.ui.toast(error.message || 'No se pudo agregar al carrito.', 'danger');
        }
    });

    dom.buyButton?.addEventListener('click', async function () {
        const size = document.querySelector('.size-btn.active')?.dataset.size || product.sizes[0] || 'M';
        const quantity = Math.min(Number(dom.quantityInput.value || 1), product.stock || 1);
        try {
            await GolazoStore.cart.add(product, quantity, size);
            window.location.href = GolazoStore.paths.checkout();
        } catch (error) {
            GolazoStore.ui.toast(error.message || 'No se pudo iniciar la compra.', 'danger');
        }
    });

    dom.reviewsPane?.addEventListener('submit', async function (event) {
        const reviewForm = event.target.closest('#reviewForm');
        if (reviewForm) {
            event.preventDefault();
            const submitBtn = reviewForm.querySelector('#reviewSubmitBtn');
            const statusEl = reviewForm.querySelector('#reviewFormStatus');
            const formData = new FormData(reviewForm);
            const rating = Number(formData.get('rating'));
            const body = String(formData.get('body') || '').trim();
            const reviewId = reviewsState.permissions?.existingReviewId || null;

            submitBtn.disabled = true;
            if (statusEl) statusEl.textContent = reviewId ? 'Actualizando reseña...' : 'Publicando reseña...';

            try {
                await submitReview(reviewId, { rating, body });
                GolazoStore.ui.toast(reviewId ? 'Reseña actualizada.' : 'Reseña publicada.', 'success');
            } catch (error) {
                GolazoStore.ui.toast(error.message || 'No se pudo guardar la reseña.', 'danger');
            } finally {
                submitBtn.disabled = false;
                if (statusEl) {
                    statusEl.textContent = reviewId ? 'Ya tienes una reseña publicada.' : 'Tu reseña quedará visible en esta ficha.';
                }
            }
            return;
        }

        const commentForm = event.target.closest('[data-review-comment-form]');
        if (commentForm) {
            event.preventDefault();
            const input = commentForm.querySelector('input[name="body"]');
            const reviewId = Number(commentForm.dataset.reviewCommentForm);
            const body = String(input?.value || '').trim();
            if (!body) return;

            const submitBtn = commentForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            try {
                await submitComment(reviewId, body);
                GolazoStore.ui.toast('Comentario publicado.', 'success');
            } catch (error) {
                GolazoStore.ui.toast(error.message || 'No se pudo publicar el comentario.', 'danger');
            } finally {
                submitBtn.disabled = false;
            }
        }
    });

    dom.reviewsPane?.addEventListener('change', function (event) {
        if (event.target.matches('#reviewForm input[name="rating"]')) {
            syncRatingChoices(event.target.closest('#reviewForm'));
        }
    });

    dom.reviewsPane?.addEventListener('click', async function (event) {
        const deleteReviewBtn = event.target.closest('[data-delete-review-id]');
        if (deleteReviewBtn) {
            const reviewId = Number(deleteReviewBtn.dataset.deleteReviewId);
            if (!window.confirm('¿Seguro que quieres eliminar tu reseña?')) return;
            deleteReviewBtn.disabled = true;
            try {
                await deleteReview(reviewId);
                GolazoStore.ui.toast('Reseña eliminada.', 'success');
            } catch (error) {
                deleteReviewBtn.disabled = false;
                GolazoStore.ui.toast(error.message || 'No se pudo eliminar la reseña.', 'danger');
            }
            return;
        }

        const deleteCommentBtn = event.target.closest('[data-delete-comment-id]');
        if (deleteCommentBtn) {
            const commentId = Number(deleteCommentBtn.dataset.deleteCommentId);
            if (!window.confirm('¿Seguro que quieres eliminar tu comentario?')) return;
            deleteCommentBtn.disabled = true;
            try {
                await deleteComment(commentId);
                GolazoStore.ui.toast('Comentario eliminado.', 'success');
            } catch (error) {
                deleteCommentBtn.disabled = false;
                GolazoStore.ui.toast(error.message || 'No se pudo eliminar el comentario.', 'danger');
            }
            return;
        }

        const editCommentBtn = event.target.closest('[data-edit-comment-id]');
        if (editCommentBtn) {
            const commentId = Number(editCommentBtn.dataset.editCommentId);
            const currentBody = String(editCommentBtn.dataset.commentBody || '').trim();
            const nextBody = window.prompt('Edita tu comentario', currentBody);
            if (nextBody === null) return;
            editCommentBtn.disabled = true;
            try {
                await updateComment(commentId, nextBody);
                GolazoStore.ui.toast('Comentario actualizado.', 'success');
            } catch (error) {
                editCommentBtn.disabled = false;
                GolazoStore.ui.toast(error.message || 'No se pudo actualizar el comentario.', 'danger');
            }
            return;
        }

        const editReviewBtn = event.target.closest('[data-edit-review-id]');
        if (editReviewBtn) {
            const reviewId = Number(editReviewBtn.dataset.editReviewId);
            const review = reviewsState.reviews.find((item) => Number(item.id) === reviewId);
            const form = dom.reviewsPane.querySelector('#reviewForm');
            if (!review || !form) return;

            form.querySelector('#reviewBody').value = review.body || '';
            const ratingInput = form.querySelector(`input[name="rating"][value="${review.rating}"]`);
            if (ratingInput) {
                ratingInput.checked = true;
            }
            syncRatingChoices(form);
            form.querySelector('#reviewBody')?.focus();
            window.location.hash = 'reviews';
        }
    });
});
