import { NextResponse } from "next/server";
import { Stripe } from "stripe";
import { getAuthSession } from '@/lib/auth';
import { PREMIUM_ENABLED } from '@/lib/features';

export async function POST(req: Request) {
  if (!PREMIUM_ENABLED) return new Response('Not found', { status: 404 });
  
  const { priceId } = await req.json();
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.redirect('/login');
  }

  const origin = req.headers.get('origin');

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-04-10',
    typescript: true,
  });

  const Stripesession = await stripe.checkout.sessions.create({
    customer_email: session.user.email ?? undefined,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${origin}/premium/success`,
    cancel_url: `${origin}/premium`,
  });

  return NextResponse.json({
    url: Stripesession.url,
  });
}