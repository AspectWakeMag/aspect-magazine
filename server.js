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

const PRODUCTS_PRICE_MAP = {
    // Cartographie précise des 5 articles avec leurs Price IDs respectifs
    'mag3-fr': 'price_1TM4AwHc9K6ONRvog5MPHyKj',
    'mag3-en': 'price_1TM4BZHc9K6ONRvosH3nqMcy',
    'mag2-fr': 'price_1TM97KHc9K6ONRvobkL3fTEU',
    'mag1-fr': 'price_1TM9AqHc9K6ONRvoBZn28US4',
    'totebag': 'price_1TM9BQHc9K6ONRvoYGyx8gv5'
};

app.post('/create-checkout-session', async (req, res) => {
    try {
        const { items } = req.body;

        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ error: 'Invalid items' });
        }

        // Générer un numéro de commande unique
        const orderNumber = `CMD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const line_items = items.map(item => {
            const stripePriceId = PRODUCTS_PRICE_MAP[item.id];

            if (!stripePriceId) {
                throw new Error(`ID de prix Stripe non configuré pour : ${item.id}`);
            }

            return {
                price: stripePriceId, // On utilise l'ID du Dashboard au lieu de créer le produit à la volée
                quantity: item.quantity
            };
        });

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items,
            success_url: `${FRONTEND_URL}/index.html?status=success&order_number=${orderNumber}`,
            cancel_url: `${FRONTEND_URL}/cart.html`,

            metadata: {
                order_number: orderNumber,
                products: JSON.stringify(items.map(item => ({ 
                    name: `${item.name} (${item.variant})`,
                    quantity: item.quantity
                })))
            },
            
            shipping_address_collection: {
                allowed_countries: [
                    'FR', 'DE', 'IT', 'ES', 'BE', 'NL', 'AT', 'PT', 'IE', 
                    'LU', 'FI', 'DK', 'SE', 'NO', 'CH', 'PL', 'CZ', 
                    'HU', 'SK', 'SI', 'HR', 'BG', 'RO', 'EE', 'LV', 
                    'LT', 'CY', 'MT', 'GR'
                ],
            },
            
            shipping_options: [
                {
                    shipping_rate_data: {
                        type: 'fixed_amount',
                        fixed_amount: {
                            amount: 800, // 8€ 
                            currency: 'eur',
                        },
                        display_name: 'Livraison France (8€)',
                        delivery_estimate: {
                            minimum: { unit: 'business_day', value: 2 },
                            maximum: { unit: 'business_day', value: 5 },
                        }
                    }
                },
                {
                    shipping_rate_data: {
                        type: 'fixed_amount',
                        fixed_amount: {
                            amount: 2000, // 20€
                            currency: 'eur',
                        },
                        display_name: 'Livraison Europe (20€)',
                        delivery_estimate: {
                            minimum: { unit: 'business_day', value: 5 },
                            maximum: { unit: 'business_day', value: 10 },
                        }
                    }
                }
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

        return res.json({ url: session.url });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: e.message });
    }
});

// Le port est dynamiquement assigné par l'hébergeur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur running on port ${PORT}`));
