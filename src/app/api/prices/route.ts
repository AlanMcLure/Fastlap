import { NextResponse } from 'next/server'
import { Stripe } from 'stripe'

export async function GET() {
  try {
    // Asegúrate de tener la clave secreta de Stripe en tu archivo .env
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      throw new Error('Stripe secret key is not defined');
    }

    // Crea una instancia de Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-04-10', // Asegúrate de usar la versión correcta de la API
      typescript: true,
    });

    // Lista los precios
    const prices = await stripe.prices.list();

    // Devuelve la respuesta JSON con los precios
    return NextResponse.json(prices.data);
  } catch (error) {
    console.error('Error fetching Stripe prices:', error);
    return NextResponse.error();
  }
}