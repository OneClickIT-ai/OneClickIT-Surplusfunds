import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';


export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return err('Stripe not configured', 503);
  }

  const { amount } = await request.json();
  const cents = Math.round(Number(amount) * 100);

  if (!cents || cents < 100 || cents > 100000) {
    return err('Amount must be between $1 and $1,000', 400);
  }

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-03-25.dahlia',
    });

    const baseUrl = process.env.NEXTAUTH_URL || 'https://surplusclickit.com';

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Donation to SurplusClickIT',
              description: 'Thank you for helping keep SurplusClickIT free!',
            },
            unit_amount: cents,
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/?donated=true`,
      cancel_url: `${baseUrl}/?donated=cancel`,
    });

    return ok({ url: checkoutSession.url });
  } catch (e) {
    console.error('Stripe donate error:', e);
    return err('Failed to create donation session', 500);
  }
}
