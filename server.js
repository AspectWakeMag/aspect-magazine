const express = require('express');
// Utilisation d'une variable d'environnement pour la clé secrète
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const app = express();

// L'URL du site sera définie par l'hébergeur (ex: https://ton-site.com)
// IMPORTANT : On garde uniquement la racine pour éviter les erreurs de redirection
const FRONTEND_URL = process.env.FRONTEND_URL || '<https://aspectwakemag.fr>';
app.use(cors({
    origin: FRONTEND_URL
}));

// ROUTE WEBHOOK : Doit être placée AVANT app.use(express.json())
// car Stripe a besoin du corps brut (raw) pour la vérification de signature.
app.post('/webhook', express.raw({type: '*/*'}), (request, response) => {
    const sig = request.headers['stripe-signature'];

    let event;

    try {
        event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    } catch (err) {
        console.error(`[WEBHOOK ERROR] Signature verification failed: ${err.message}`);
        return response.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Gestion de l'événement de paiement réussi
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        // Récupération des données importantes
        const orderNumber = session.metadata.order_number;
        const customerEmail = session.customer_details.email;
        const products = JSON.parse(session.metadata.products);

        console.log(`STREAMS_OK: Commande ${orderNumber} payée par ${customerEmail}`);
        console.log(`ARTICLES:`, products);
        
        // ICI : Tu peux ajouter ta logique (envoyer un email, décrémenter le stock, etc.)
        // fulfillOrder(session); 
    }

    // Envoyer une réponse 200 à Stripe pour confirmer la réception
    response.send();
});

// Middleware pour les autres routes
app.use(express.json());


// ÉTAPE 1 : Le "Mapping" (Le lien entre ton site et le catalogue Stripe)
const STRIPE_PRICE_MAPPING = {
    'mag3-fr': 'price_1TM4AwHc9K6ONRvog5MPHyKj',
    'mag3-en': 'price_1TM4BZHc9K6ONRvosH3nqMcy',
    'mag2-fr': 'price_1TM97KHc9K6ONRvobkL3fTEU',
    'mag1-fr': 'price_1TM9AqHc9K6ONRvoBZn28US4',
    'totebag': 'price_1TM9BQHc9K6ONRvoYGyx8gv5'
};

app.post('/create-checkout-session', async (req, res) => {
    try {
        const { items, shippingZone } = req.body;
        
        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new Error('Le panier est vide ou invalide.');
        }

        // Validation de la zone d'expédition
        if (!['FR', 'EU'].includes(shippingZone)) {
            throw new Error('Zone de livraison non supportée.');
        }

        const orderNumber = `CMD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const line_items = items.map(item => {
            const stripePriceId = STRIPE_PRICE_MAPPING[item.id];
            
            if (!stripePriceId) {
                throw new Error(`Price ID non trouvé pour l'article : ${item.id}`);
            }

            // Validation stricte de la quantité
            // Max 10 articles par type pour éviter les erreurs de saisie
            let validatedQuantity = Math.max(1, parseInt(item.quantity) || 1);
            validatedQuantity = Math.min(validatedQuantity, 100);

            return {
                price: stripePriceId,
                quantity: validatedQuantity,
            };
        });

        console.log(`[NODE] Création session pour ${orderNumber} (${line_items.length} articles)`);

        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            line_items,
            success_url: `${FRONTEND_URL}/success.html?order_number=${orderNumber}`,
            cancel_url: `${FRONTEND_URL}/cancel.html`,

            metadata: {
                order_number: orderNumber,
                products: JSON.stringify(items.map(item => ({ 
                    name: `${item.name} (${item.variant})`,
                    quantity: item.quantity
                })))
            },
            
            shipping_address_collection: {
                // Si c'est la France, on restreint à FR, sinon on autorise le reste de l'Europe
                allowed_countries: shippingZone === 'FR' ? ['FR'] : [
                    'DE', 'IT', 'ES', 'BE', 'NL', 'AT', 'PT', 'IE', 
                    'LU', 'FI', 'DK', 'SE', 'NO', 'CH', 'PL', 'CZ', 
                    'HU', 'SK', 'SI', 'HR', 'BG', 'RO', 'EE', 'LV', 
                    'LT', 'CY', 'MT', 'GR'
                ],
            },
            
            shipping_options: [
                { shipping_rate: shippingZone === 'FR' ? 'shr_1TM1RnHc9K6ONRvomamTK7TZ' : 'shr_1TM1S9Hc9K6ONRvoQFhiPXHT' }
            ],

            // Création automatique de facture/reçu
            invoice_creation: {
                enabled: true,
                invoice_data: {
                    description: `Commande ${orderNumber}`,
                }
            },
        });

        console.log("SESSION URL =", session.url);
        res.json({ url: session.url });

    } catch (e) {
        console.error("[STRIPE ERROR]", e.message);
        return res.status(500).json({ error: e.message });
    }
});

// Le port est dynamiquement assigné par l'hébergeur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur running on port ${PORT}`));
