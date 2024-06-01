import { NextResponse } from "next/server";
import { Stripe } from "stripe";
import { getAuthSession } from '@/lib/auth';

export async function POST(req: Request) {
  
  const { priceId } = await req.json();
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.redirect('/login');
  }

  const origin = req.headers.get('origin');

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const Stripesession = await stripe.checkout.sessions.create({
    customer_email: session.user.email,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${origin}/home`,
    cancel_url: `${origin}/premium`,
  });

  return NextResponse.json({
    url: Stripesession.url,
  });
}