const express = require('express');
// Utilisation d'une variable d'environnement pour la clé secrète
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');


const app = express();
app.use(express.json());
app.use(cors());

// L'URL du site sera définie par l'hébergeur (ex: https://ton-site.com)
// IMPORTANT : On garde uniquement la racine pour éviter les erreurs de redirection
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://aspect-magazine.vercel.app';

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

        const orderNumber = `CMD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const line_items = items.map(item => {
            const stripePriceId = STRIPE_PRICE_MAPPING[item.id];
            
            if (!stripePriceId) {
                throw new Error(`Price ID non trouvé pour l'article : ${item.id}`);
            }

            return {
                price: stripePriceId,
                quantity: item.quantity,
            };
        });

        console.log(`[NODE] Création session pour ${orderNumber} (${line_items.length} articles)`);

        const session = await stripe.checkout.sessions.create({
            automatic_payment_methods: { enabled: true },
            mode: 'payment',
            line_items,
            // Utilisation de la racine / pour éviter les erreurs de chemin index.html
            success_url: `${FRONTEND_URL}/?status=success&order_number=${orderNumber}`,
            cancel_url: `${FRONTEND_URL}/cart.html`,

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
