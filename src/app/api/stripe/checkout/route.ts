import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, err } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return err('Stripe not configured', 503);
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return err('Unauthorized', 401);

  const { priceId } = await request.json();
  if (!priceId) return err('Price ID required', 400);

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-03-25.dahlia',
    });

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: session.user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?subscribed=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing`,
      metadata: {
        userId: session.user.id,
      },
    });

    return ok({ url: checkoutSession.url });
  } catch (e) {
    console.error('Stripe checkout error:', e);
    return err('Failed to create checkout session', 500);
  }
}
