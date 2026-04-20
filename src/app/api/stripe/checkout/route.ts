import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth';
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

    // Find or create Stripe customer with userId in metadata
    const existingCustomers = await stripe.customers.list({
      email: session.user.email!,
      limit: 1,
    });

    let customerId: string;
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
      await stripe.customers.update(customerId, {
        metadata: { userId: session.user.id },
      });
    } else {
      const customer = await stripe.customers.create({
        email: session.user.email!,
        name: session.user.name || undefined,
        metadata: { userId: session.user.id },
      });
      customerId = customer.id;
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customerId,
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
