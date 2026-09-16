export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  mode: 'subscription' | 'payment';
  features: string[];
  highlight?: string;
}

export const STRIPE_PRODUCTS: StripeProduct[] = [
  {
    id: 'prod_QikFP1nZmEMqOs',
    priceId: 'price_1PrIksIs6L3hD9y66zoxwAX9',
    name: 'Boost',
    description: 'Give your tool maximum visibility across the entire platform.',
    price: 49.90,
    currency: 'usd',
    mode: 'subscription',
    highlight: 'Best for tool makers',
    // Solo lo que existe. Aquí ponía "Monthly performance analytics" y no hay
    // ninguna vista de analíticas para el maker en toda la aplicación: era una
    // promesa en la factura de algo que no se entrega.
    features: [
      'Full-width card at the top of the directory',
      'First on your category page',
      'Boosted section on the homepage',
      'Demo video on your tool page',
      'Boosted badge on your card',
      'First in search results',
    ],
  },
];

export const getProductById = (id: string): StripeProduct | undefined => {
  return STRIPE_PRODUCTS.find(product => product.id === id);
};
