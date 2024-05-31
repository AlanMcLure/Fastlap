import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import { headers } from 'next/headers';
import { Stripe } from 'stripe';
import { db } from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextApiRequest, res: NextApiResponse) {
    
    const buf = await buffer(req);
    const headersList = headers();
    const sig = headersList.get('stripe-signature');

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(buf, sig!, webhookSecret);
    } catch (err) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const invoice = event.data.object;
        const customerEmail = invoice.customer_email;

        if (customerEmail) {
          // Buscar al usuario en tu base de datos usando el email
          const user = await db.user.findUnique({ where: { email: customerEmail } });
          if (user) {
            await db.user.update({
              where: { id: user.id },
              data: { role: 'PREMIUM' },
            });
          }
        }
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.status(200).json({ received: true });

}
