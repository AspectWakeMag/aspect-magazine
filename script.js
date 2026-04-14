document.addEventListener('DOMContentLoaded', () => {

    // --- 0. GESTION RETOUR PAIEMENT ---
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('status') === 'success') {
        localStorage.removeItem('aspect_cart');
        const orderNumber = urlParams.get('order_number');
        if (orderNumber) {
            // Petit délai pour s'assurer que le DOM est prêt
            setTimeout(() => showOrderConfirmation(orderNumber), 500);
        }
    }

    // --- 1. DATA LAYER (Source de vérité) ---
    const PRODUCTS = [
        {
            id: 'mag3-fr', baseId: 'mag3', lang: 'FR', title: "Aspect Magazine Numero 3", subtitle: "Cover by Detty Marie", price: 15.00,
            desc: "Find exclusive interviews with the world’s top riders, articles about the industry, and tips to improve your performance — a magazine by enthusiasts, for enthusiasts.",
            specs: "130 pages, 200 mm x 270 mm, printed in France.",
            images: ["images/MAG 3 RECTO.jpg", "images/MAG 3 VERSO.jpg", "images/MAG 3 LIFESTYLE.jpg"],
            summary: [["Roatrdip", "ROAD to LAO"], ["Contest", "LAO"], ["Interview", "Tino"], ["Art", "Soline Bourdon"], ["Young Guns", "Eva rivière"], ["Interlude", "Gottes Kinder"], ["Industrie", "Cabana Wakeskate"], ["Portrait", "Maxime Roux"], ["Video Club", "Spicy Tv"], ["Interview", "Enzo Asseraf"], ["Portrait", "Hervé Puyol"], ["Impact", "Prépa mentale, visualisation"], ["Carte blanche", "Max Evans"], ["Récit", "Jules Charraud, Winter Holidays"], ["Video", "Singularity project"], ["Portfolio", "Sam Strauss"], ["Video", "Vivid"], ["La playlist d'un rider", "Bobby Carne"], ["Playground", "Casse tête - Mots fléchés"]]
        },
        {
            id: 'mag3-en', baseId: 'mag3', lang: 'EN', title: "Aspect Magazine Numero 3", subtitle: "Cover by Detty Marie", price: 15.00,
            desc: "Find exclusive interviews with the world’s top riders, articles about the industry, and tips to improve your performance — a magazine by enthusiasts, for enthusiasts.",
            specs: "130 pages, 200 mm x 270 mm, printed in France.",
            images: ["images/MAG 3 RECTO.jpg", "images/MAG 3 VERSO.jpg", "images/MAG 3 LIFESTYLE.jpg"],
            summary: [["Roatrdip", "ROAD to LAO"], ["Contest", "LAO"], ["Interview", "Tino"], ["Art", "Soline Bourdon"], ["Young Guns", "Eva rivière"], ["Interlude", "Gottes Kinder"], ["Industrie", "Cabana Wakeskate"], ["Portrait", "Maxime Roux"], ["Video Club", "Spicy Tv"], ["Interview", "Enzo Asseraf"], ["Portrait", "Hervé Puyol"], ["Impact", "Prépa mentale, visualisation"], ["Carte blanche", "Max Evans"], ["Récit", "Jules Charraud, Winter Holidays"], ["Video", "Singularity project"], ["Portfolio", "Sam Strauss"], ["Video", "Vivid"], ["La playlist d'un rider", "Bobby Carne"], ["Playground", "Casse tête - Mots fléchés"]]
        },
        {
            id: 'mag2-fr', baseId: 'mag2', lang: 'FR', title: "Aspect Magazine Numero 2", subtitle: "Cover By Alexis Nilias", price: 10.00,
            desc: "Find exclusive interviews with the world’s top riders, articles about the industry, and tips to improve your performance.",
            specs: "150 pages, 200 mm x 270 mm, printed in France, magazine in French.",
            images: ["images/MAG 2 RECTO.jpg", "images/MAG 2 VERSO.jpg", "images/MAG 2 LIFESTYLE.gif"],
            summary: [["Photo report", "Ys6"], ["Backside - frontside", "Trent & Gavin Stuckey"], ["Interview", "Ile Vegni"], ["Opinion", "Les bases sacrées de la Force"], ["Interview", "Hexa : un crew et une Jam nouvelle générartion"], ["Portfolio", "Steffen Vollert, tour après tour"], ["Contest report", "Red Bull Wake the City"], ["Art", "Nane et les 15 ans de la Peak"], ["Legends", "Shred Town : à l'origine d'une révolution"], ["Impact", "Bien préparer sa saison"], ["Portrait", "Dom Hernler"], ["Opinion", "Une vidéo pas comme les autres"], ["Portrait", "Maxime Cadoux"], ["Framed", "Dans les coulisses du Sitwake"], ["Interview", "Loic Deschaux & Robin Carayol"], ["Portrait", "Maryh Rougier"], ["Diy", "Le guide du parfait Wakepants"], ["Photo", "Sewer cats"]]
        },
        {
            id: 'mag1-fr', baseId: 'mag1', lang: 'FR', title: "Aspect Magazine Numero 1", subtitle: "Cover By Sam Strauss", price: 10.00,
            desc: "Find exclusive interviews with the world’s top riders, articles about the industry, and tips to improve your performance.",
            specs: "136 pages, 200 mm x 270 mm, printed in France, magazine in French.",
            images: ["images/MAG 1 RECTO.jpg", "images/MAG 1 VERSO.jpg", "images/MAG 1 LIFESTYLE.jpg"],
            stockLimit: 6,
            summary: [["Interview", "Tao, Innovation continue"], ["Chronique", "Les Copains d’abords"], ["Report", "Wakeskate Cup"], ["Backside/Frontside", "Les Sœurs Rougerie"], ["Trip", "Un paradis…ca se mérite"], ["Échanges", "Contest, (R)evolution"], ["Interview", "Copycatsclub"], ["Report", "Wakeboard Street Jam"], ["Matos 2024", "Suivez le guide"], ["Framed", "Mathilde Revil"], ["Impact", "Ôde a la blessure"], ["Trip", "Yardsale 5"], ["Young Blood", "Esteban Diruy"], ["Art", "Kathleen Neeley"], ["Portfolio", "Bryan Soderlind"], ["Diy", "Répare ta planche !"]]
        },
        {
            id: 'totebag', baseId: 'totebag', lang: 'Unique', title: "Aspect Tote Bag", subtitle: "100% Cotton", price: 15.00,
            desc: "High quality 100% cotton tote bag, perfect for your daily gear.",
            specs: "100% Cotton, 200 mm x 270 mm, printed in France.",
            images: ["images/TOTE BAG PACKSHOT.jpg", "images/TOTE BAG VERSO.jpg", "images/TOTE LIFESTYLE.gif"],
            summary: null
        }
    ];

    // --- 2. SERVICE LAYER (Logique métier) ---
    const getProductById = (id) => PRODUCTS.find(p => p.id === id);
    const getProductsByBaseId = (baseId) => PRODUCTS.filter(p => p.baseId === baseId);

    // --- 3. UI LAYER (DOM Rendering) ---
    const initProductPage = () => {
        const urlParams = new URLSearchParams(window.location.search);
        let prodId = urlParams.get('id');
        
        // Fallback si l'URL est incomplète
        if (prodId && !prodId.includes('-') && prodId !== 'totebag') prodId += '-fr';
        
        const product = getProductById(prodId || 'mag3-fr');
        if (product && document.body.classList.contains('product-page')) {
            renderProduct(product);
        }
    };

    const renderProduct = (product) => {
        document.getElementById('p-title').textContent = product.title;
        document.getElementById('p-subtitle').textContent = product.subtitle;
        document.getElementById('p-price').textContent = product.price.toFixed(2).replace('.', ',') + " €";
        document.getElementById('p-desc').textContent = product.desc;
        
        // Formatage des caractéristiques : une info par ligne (saut de ligne après chaque virgule)
        const formattedSpecs = product.specs.split(',').map(s => s.trim()).join(',<br>');
        document.getElementById('p-specs').innerHTML = `<p>${formattedSpecs}</p>`;
        
        const carousel = document.getElementById('product-carousel');
        let carouselHtml = product.images.map((img, i) => `<img src="${img}" class="carousel-img ${i===0?'active':''}" alt="Image ${i}">`).join('');
        
        // Ajout des flèches de navigation
        carouselHtml += `<button class="carousel-arrow prev">←</button>`;
        carouselHtml += `<button class="carousel-arrow next">→</button>`;
        
        carousel.innerHTML = carouselHtml;
        initCarousel('product-carousel');

        if (product.summary) {
            document.getElementById('toggle-content').style.display = 'inline-block';
            document.getElementById('p-summary').innerHTML = product.summary.map(s => `<div class="summary-row-2"><span>${s[0]}</span><span>${s[1]}</span></div>`).join('');
        } else {
            document.getElementById('toggle-content').style.display = 'none';
        }

        // Gestion Langue via le Service Layer
        const variants = getProductsByBaseId(product.baseId);
        const langSelector = document.getElementById('lang-selector');
        if (variants.length > 1) {
            langSelector.style.display = 'block';
            const btnFr = document.getElementById('lang-fr');
            const btnEn = document.getElementById('lang-en');

            // Met en noir (active) la langue sélectionnée, grise l'autre
            btnFr.classList.toggle('active', product.lang === 'FR');
            btnEn.classList.toggle('active', product.lang === 'EN');
            
            btnFr.onclick = () => window.location.href = `product.html?id=${product.baseId}-fr`;
            btnEn.onclick = () => window.location.href = `product.html?id=${product.baseId}-en`;
        } else {
            langSelector.style.display = 'none';
        }

        if (product.stockLimit) {
            const stockEl = document.getElementById('p-stock');
            stockEl.textContent = `only ${product.stockLimit} magazine left`;
            stockEl.style.display = 'block';
        }

        document.getElementById('add-to-cart-dynamic').onclick = () => addToCart(product.id);
    };

    // Synchronisation automatique des prix dans tout le site (Shop, etc.)
    const syncPrices = () => {
        PRODUCTS.forEach(p => {
            const priceElements = document.querySelectorAll(`[data-price-id="${p.baseId}"], [data-price-id="${p.id}"]`);
            priceElements.forEach(el => {
                el.textContent = p.price.toFixed(2).replace('.', ',') + " €";
            });
        });
    };

    // --- 4. PANIER (Compatibilité nouvelle architecture) ---

    const getCart = () => JSON.parse(localStorage.getItem('aspect_cart')) || [];

    const saveCart = (cart) => {
        localStorage.setItem('aspect_cart', JSON.stringify(cart));
        updateCartUI();
    };

    const addToCart = (productId) => {
        const product = getProductById(productId);
        const cart = getCart();
        const existingItem = cart.find(item => item.id === productId);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ id: productId, quantity: 1 });
        }
        saveCart(cart);
        showCartOverlay(product.title);
    };

    const removeFromCart = (productId) => {
        const cart = getCart().filter(item => item.id !== productId);
        saveCart(cart);
    };

    const updateQuantity = (productId, delta) => {
        const cart = getCart();
        const item = cart.find(item => item.id === productId);
        const product = getProductById(productId);

        if (item) {
            let newQty = item.quantity + delta;
            if (product?.stockLimit && newQty > product.stockLimit) return alert(`Stock limité à ${product.stockLimit} exemplaires.`);
            item.quantity = Math.max(1, newQty);
            saveCart(cart);
        }
    };

    // --- LOGIQUE OVERLAY (MODAL D'AJOUT AU PANIER) ---
    // Injection des styles pour un rendu professionnel et fiable
    const modalStyles = document.createElement('style');
    modalStyles.textContent = `
        .cart-overlay {
            position: fixed;
            inset: 0;
            background: rgba(255, 255, 255, 0.75);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.4s ease;
            pointer-events: none;
        }
        .cart-overlay.visible {
            display: flex;
            opacity: 1;
            pointer-events: auto;
        }
        .cart-overlay p {
            margin: 0;
        }
        main { transition: opacity 0.2s ease; }
        body.modal-open main { opacity: 0.2; }
    `;
    document.head.appendChild(modalStyles);

    const cartOverlay = document.createElement('div');
    cartOverlay.classList.add('cart-overlay');
    cartOverlay.innerHTML = '<p></p>';
    document.body.appendChild(cartOverlay);

    function showCartOverlay(productName) {
        const textElement = cartOverlay.querySelector('p');
        textElement.textContent = `${productName} added to cart`;
        
        document.body.classList.add('modal-open');
        cartOverlay.classList.add('visible');

        setTimeout(() => {
            cartOverlay.classList.remove('visible');
            document.body.classList.remove('modal-open');
        }, 2000);
    }

    // --- LOGIQUE POP-UP CONFIRMATION ---
    function showOrderConfirmation(orderNumber) {
        const overlay = document.createElement('div');
        overlay.classList.add('order-overlay');
        
        overlay.innerHTML = `
            <div class="order-modal">
                <div class="modal-top">
                    <p>Order n°${orderNumber}</p>
                    <p>Check your email for order confirmation.</p>
                </div>
                <div class="modal-center">
                    <p>Thank you<br>for your order.</p>
                </div>
                <div class="modal-bottom">
                    <p>You can enjoy even more content<br>on our instagram 
                       <a href="https://www.instagram.com/aspectwakemag/" target="_blank" class="btn-nav" style="opacity:1">@aspectwakemag</a>
                    </p>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        document.body.classList.add('modal-open');
        setTimeout(() => overlay.classList.add('visible'), 10);

        // Fermeture au clic sur l'overlay (autour du pop-up)
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('visible');
                document.body.classList.remove('modal-open');
                // Nettoie l'URL pour éviter que le pop-up revienne au refresh
                window.history.replaceState({}, document.title, "/");
                setTimeout(() => overlay.remove(), 400);
            }
        };
    }

    // --- MISE À JOUR DE L'INTERFACE ---

    const updateCartUI = () => {
        const cart = getCart();
        const totalQty = cart.reduce((acc, item) => acc + item.quantity, 0);
        
        // Mise à jour de tous les boutons "Cart (X)" dans les headers
        const cartButtons = document.querySelectorAll('a[href="cart.html"]');
        cartButtons.forEach(btn => {
            btn.textContent = `Cart (${totalQty})`;
            
            // Animation slide gauche -> droite
            if (totalQty > 0) {
                btn.style.display = 'inline-block';
                btn.style.transition = 'all 0.5s ease';
                btn.style.opacity = '1';
                btn.style.transform = 'translateX(0)';
            } else if (!btn.classList.contains('active')) {
                // On cache si 0, sauf si on est sur la page panier elle-même
                btn.style.opacity = '0';
                btn.style.transform = 'translateX(40px)'; // Glisse vers la droite
                setTimeout(() => { if(btn.style.opacity === '0') btn.style.display = 'none'; }, 500);
            }
        });

        // Si on est sur la page panier, on rend la liste
        if (document.body.classList.contains('cart-page')) {
            renderCartPage(cart);
        }
    };

    const renderCartPage = (cart) => {
        const container = document.querySelector('.cart-items-container');
        const recapPrice = document.querySelector('.recap-grid .col-3.align-right');
        if (!container) return;

        if (cart.length === 0) {
            container.innerHTML = '<p style="padding: 20px; opacity: 0.5;">Your cart is empty.</p>';
            if (recapPrice) recapPrice.textContent = '0,00 €';
            return;
        }

        let html = '';
        let grandTotal = 0;

        cart.forEach(item => {
            const product = getProductById(item.id);
            const subtotal = product.price * item.quantity;
            grandTotal += subtotal;
            html += `
                <div class="cart-item">
                    <hr class="cart-line">
                    <div class="item-grid">
                        <img src="${product.images[0]}" class="item-img" alt="${product.title}">
                        <div class="item-top">
                            <div class="item-info">
                                <span>${product.title} (${product.lang})</span>
                                <span class="item-price">${product.price.toFixed(2)} €</span>
                            </div>
                            <button class="btn-nav delete-item" data-id="${item.id}">Delete</button>
                        </div>
                        <div class="item-bottom">
                            <div class="item-quantity">
                                <span>Quantity</span>
                                <button class="btn-nav qty-change" data-id="${item.id}" data-delta="-1">-</button>
                                <span>${item.quantity}</span>
                                <button class="btn-nav qty-change" data-id="${item.id}" data-delta="1">+</button>
                            </div>
                            <div class="item-subtotal">Subtotal ${subtotal.toFixed(2)} €</div>
                        </div>
                    </div>
                    <hr class="cart-line">
                </div>
            `;
        });

        container.innerHTML = html;
        if (recapPrice) recapPrice.textContent = `${grandTotal.toFixed(2)} €`;

        // Events pour Delete et Quantité
        container.querySelectorAll('.delete-item').forEach(btn => {
            btn.addEventListener('click', () => removeFromCart(btn.dataset.id));
        });
        container.querySelectorAll('.qty-change').forEach(btn => {
            btn.addEventListener('click', () => updateQuantity(btn.dataset.id, parseInt(btn.dataset.delta)));
        });
    };

    const checkoutBtn = document.querySelector('.recap-footer button');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', async () => {
            const cart = getCart();
            if (cart.length === 0) return;

            checkoutBtn.disabled = true;
            checkoutBtn.textContent = 'Processing...';

            // Détection automatique de l'URL du backend
            const API_URL = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' 
                ? 'http://127.0.0.1:3000' 
                : 'https://aspect-magazine-backend.onrender.com'; // <--- Ton URL Render ici

            try {
                const itemsForBackend = cart.map(item => {
                    const p = getProductById(item.id);
                    return { id: item.id, quantity: item.quantity, name: p.title, image: p.images[0], variant: p.lang };
                });
                const response = await fetch(`${API_URL}/create-checkout-session`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ items: itemsForBackend })
                });

                const { url, error } = await response.json();
                if (error) throw new Error(error);
                window.location.href = url; // Redirection vers Stripe
            } catch (err) {
                console.error("Checkout error:", err);
                alert("An error occurred during checkout. Please try again.");
                checkoutBtn.disabled = false;
                checkoutBtn.textContent = 'Continue to shipping infos →';
            }
        });
    }

    // --- CARROUSEL ---
   function initCarousel(carouselId, autoPlayDelay = 0) {
        const carousel = document.getElementById(carouselId);
        if (!carousel) return;
        
        const images = carousel.querySelectorAll('.carousel-img');
        if (images.length < 2) return;
        let currentImg = 0;
        let isTransitioning = false;

        const showSlide = (direction = 1) => {
            if (isTransitioning) return;
            isTransitioning = true;

            const prevImg = images[currentImg];
            if (direction === 1) {
                currentImg = (currentImg + 1) % images.length;
            } else {
                currentImg = (currentImg - 1 + images.length) % images.length;
            }
            const nextImg = images[currentImg];

            if (direction === 1) {
                prevImg.classList.add('exit');
                prevImg.classList.remove('active');
                nextImg.classList.add('active');
            } else {
                // Retour arrière : on place l'image à gauche sans transition avant de l'animer
                nextImg.style.transition = 'none';
                nextImg.style.transform = 'translateX(-100%)';
                nextImg.offsetHeight; // Force le reflow
                
                nextImg.style.transition = '';
                prevImg.classList.add('exit-right');
                prevImg.classList.remove('active');
                nextImg.classList.add('active');
            }

            setTimeout(() => {
                prevImg.style.transition = 'none';
                prevImg.classList.remove('exit');
                prevImg.classList.remove('exit-right');
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => prevImg.style.transition = '');
                });
                isTransitioning = false;
            }, 1000);
        };

        // Gestion des clics sur les flèches ou le conteneur
        carousel.addEventListener('click', (e) => {
            if (e.target.classList.contains('prev')) {
                showSlide(-1);
            } else {
                showSlide(1);
            }
        });

        // Auto-play uniquement si demandé et sur mobile
        if (autoPlayDelay > 0 && window.innerWidth <= 1100) {
            setInterval(() => showSlide(1), autoPlayDelay);
        }
    }

    initCarousel('carousel', 2000); // Auto-play 2s pour la landing
    initCarousel('product-carousel');

    const follower = document.getElementById('cursor-follower');

    // Curseur personnalisé "see more"
    const leftPane = document.querySelector('.left-pane');
    if (leftPane && follower) {
        leftPane.addEventListener('mousemove', (e) => {
            follower.style.opacity = '1';
            follower.style.left = e.clientX + 'px';
            follower.style.top = e.clientY + 'px';
        });

        leftPane.addEventListener('mouseleave', () => {
            follower.style.opacity = '0';
        });
    }

    // --- ANIMATION SOMMAIRE ET COMPTEUR ---
    
    // 1. Sommaire (Landing Page) - Animation séquentielle caractère par caractère, ligne par ligne
    const summaryList = document.getElementById('summary-list');
    if (summaryList) {
        const summaryRows = summaryList.querySelectorAll('.summary-row');
        summaryRows.forEach(row => {
            const spans = row.querySelectorAll('span');
            spans.forEach(span => splitToChars(span));
        });

        const summaryObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const allChars = summaryList.querySelectorAll('.char');
                    allChars.forEach((char, index) => {
                        setTimeout(() => {
                            char.style.opacity = '1';
                        }, index * 9); // Vitesse adaptée pour un défilement fluide du bloc entier
                    });

                    if (!window.counterStarted) {
                        window.counterStarted = true;
                        animateCounter(performance.now());
                    }
                    summaryObserver.unobserve(summaryList);
                }
            });
        }, { threshold: 0.1 });
        summaryObserver.observe(summaryList);
    }

    // 2. Textes animés (About section & blocs .animate-text)
    const animateTexts = document.querySelectorAll('.animate-text');
    animateTexts.forEach(container => {
        splitToChars(container);
        
        const textObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const chars = container.querySelectorAll('.char');
                    chars.forEach((char, index) => {
                        setTimeout(() => {
                            char.style.opacity = '1';
                        }, index * 15);
                    });
                    textObserver.unobserve(container);
                }
            });
        }, { threshold: 0.1 });
        textObserver.observe(container);
    });

    function splitToChars(element) {
        const text = element.textContent.trim();
        element.textContent = '';
        const words = text.split(/\s+/);

        for (let i = 0; i < words.length; i++) {
            const wordWrapper = document.createElement('span');
            wordWrapper.classList.add('word-wrap');

            const addLetters = (word) => {
                for (let char of word) {
                    const charSpan = document.createElement('span');
                    charSpan.textContent = char;
                    charSpan.classList.add('char');
                    wordWrapper.appendChild(charSpan);
                }
            };

            addLetters(words[i]);

            // Protection contre les mots courts isolés en fin de ligne
            // Si le mot suivant est le dernier et fait moins de 3 caractères, on le fusionne
            if (i === words.length - 2 && words[i+1].length < 3) {
                const space = document.createElement('span');
                space.textContent = '\u00A0'; // Espace insécable
                space.classList.add('char');
                wordWrapper.appendChild(space);
                
                addLetters(words[i+1]);
                i++; // On saute le mot suivant puisqu'il est déjà ajouté
            }

            element.appendChild(wordWrapper);

            if (i < words.length - 1) {
                const space = document.createTextNode(' ');
                element.appendChild(space);
            }
        }
    }

    // Compteur de pages
    const pageCounter = document.getElementById('page-counter');
    const targetPages = 130;
    const counterDuration = 3700;

    // Compteur de pages synchronisé
    let startTime = null;

    function animateCounter(timestamp) {
        if (!pageCounter) return;
        if (!startTime) startTime = timestamp;
        const progress = timestamp - startTime;
        const percentage = Math.min(progress / counterDuration, 1);
        
        const currentCount = Math.floor(percentage * targetPages);
        pageCounter.textContent = currentCount;

        if (percentage < 1) {
            requestAnimationFrame(animateCounter);
        }
    }

    // --- TRANSFERT DE SCROLL (RIGHT TO LEFT) ---
    // Permet de scroller les produits même si la souris est sur la partie droite
    const shopRightPane = document.querySelector('.shop-page .right-pane');
    const shopScrollablePane = document.querySelector('.shop-page .scrollable-pane');

    if (shopRightPane && shopScrollablePane) {
        shopRightPane.addEventListener('wheel', (e) => {
            shopScrollablePane.scrollTop += e.deltaY;
        }, { passive: true });
    }

    // --- NAVIGATION VERROUILLÉE ---
    // Remplace le scroll par un système de switch de section (SPA)
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    function switchSection(targetId) {
        const sections = document.querySelectorAll('.main-container');
        sections.forEach(s => s.classList.remove('active'));
        
        const target = document.querySelector(targetId);
        if (target) {
            target.classList.add('active');
            // Réinitialise le scroll du panneau de droite au changement
            const rightPane = target.querySelector('.right-pane');
            if (rightPane) rightPane.scrollTop = 0;
        }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');
            if (targetId.startsWith('#')) {
                e.preventDefault();
                history.pushState(null, null, targetId);
                switchSection(targetId);
            }
        });
    });

    // Gère le bouton "Retour" du navigateur
    window.addEventListener('popstate', () => {
        const hash = window.location.hash || '#landing';
        switchSection(hash);
    });

    // --- PRODUCT PAGE TOGGLE ---
    const toggleContentBtn = document.getElementById('toggle-content');
    const magazineContent = document.getElementById('magazine-content');

    if (toggleContentBtn && magazineContent) {
        toggleContentBtn.addEventListener('click', () => {
            const isOpen = magazineContent.classList.toggle('open');
            toggleContentBtn.textContent = isOpen ? 'Hide content' : 'See content';
            // On ne toggle pas la classe 'active' pour que le bouton reste grisé (opacity 0.2)
        });
    }

    // --- INITIALISATION ---
    // Active la section par défaut au chargement
    const initialHash = window.location.hash || '#landing';
    switchSection(initialHash);

    initCarousel('carousel');
    initProductPage();
    syncPrices();
    updateCartUI();
});

/**
 * Note sur la performance : requestAnimationFrame est utilisé pour le compteur 
 * afin d'assurer une fluidité maximale à 60fps.
 */