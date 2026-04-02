import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getUserIdFromCustomer(stripe: InstanceType<typeof import('stripe').default>, customerId: string): Promise<string | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return null;
    // Prefer metadata userId, fall back to email lookup
    if (customer.metadata?.userId) return customer.metadata.userId;
    if (customer.email) {
      const user = await prisma.user.findUnique({ where: { email: customer.email } });
      return user?.id || null;
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-03-25.dahlia',
    });

    const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: { role: 'pro' },
          });
          console.log(`User ${userId} upgraded to Pro`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const userId = await getUserIdFromCustomer(stripe, invoice.customer as string);
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: { role: 'pro' },
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const failedInvoice = event.data.object;
        const userId = await getUserIdFromCustomer(stripe, failedInvoice.customer as string);
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: { role: 'user' },
          });
          console.log(`Payment failed for user ${userId}, downgraded`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const userId = await getUserIdFromCustomer(stripe, sub.customer as string);
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: { role: 'user' },
          });
          console.log(`Subscription cancelled for user ${userId}`);
        }
        break;
      }

      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error('Stripe webhook error:', e);
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }
}
