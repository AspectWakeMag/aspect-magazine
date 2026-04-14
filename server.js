const express = require('express');
// Utilisation d'une variable d'environnement pour la clé secrète
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');


const app = express();
app.use(express.json());
app.use(cors());

// L'URL du site sera définie par l'hébergeur (ex: https://ton-site.com)
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://aspect-magazine.vercel.app/index.html#landing';

const PRODUCTS_PRICE_MAP = {
    mag3: 1500,
    mag2: 1000,
    mag1: 1000,
    totebag: 1500
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
            const baseId = item.id.split('-')[0];
            const unitAmount = PRODUCTS_PRICE_MAP[baseId];

            if (!unitAmount) {
                throw new Error(`Produit inconnu: ${item.id}`);
            }

            // Stripe exige des URLs absolues pour les images.
            // On utilise encodeURI pour s'assurer que l'URL est bien formée (espaces, etc.)
            const imageUrls = [];
            if (item.image) {
                const absoluteUrl = encodeURI(`${FRONTEND_URL}/${item.image}`);
                imageUrls.push(absoluteUrl);
            }

            return {
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: `${item.name} (${item.variant})`,
                        images: imageUrls
                    },
                    unit_amount: unitAmount
                },
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
            
            // Utilisation des identifiants Shipping Rates du Dashboard
            // Stripe sélectionnera automatiquement le bon tarif selon le pays
            shipping_options: [
                { shipping_rate: 'shr_1TM1RnHc9K6ONRvomamTK7TZ' }, // France 8€
                { shipping_rate: 'shr_1TM1S9Hc9K6ONRvoQFhiPXHT' }  // Europe 20€
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
