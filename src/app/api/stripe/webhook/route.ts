import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
      // New subscription
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

      // Subscription renewed successfully
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const customerId = invoice.customer as string;
        const customer = await stripe.customers.retrieve(customerId);
        if (customer && !customer.deleted && customer.email) {
          await prisma.user.updateMany({
            where: { email: customer.email },
            data: { role: 'pro' },
          });
        }
        break;
      }

      // Payment failed — downgrade after grace period
      case 'invoice.payment_failed': {
        const failedInvoice = event.data.object;
        const failedCustomerId = failedInvoice.customer as string;
        const failedCustomer = await stripe.customers.retrieve(failedCustomerId);
        if (failedCustomer && !failedCustomer.deleted && failedCustomer.email) {
          await prisma.user.updateMany({
            where: { email: failedCustomer.email },
            data: { role: 'user' },
          });
          console.log(`Payment failed for ${failedCustomer.email}, downgraded`);
        }
        break;
      }

      // Subscription cancelled
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const subCustomerId = sub.customer as string;
        const subCustomer = await stripe.customers.retrieve(subCustomerId);
        if (subCustomer && !subCustomer.deleted && subCustomer.email) {
          await prisma.user.updateMany({
            where: { email: subCustomer.email },
            data: { role: 'user' },
          });
          console.log(`Subscription cancelled for ${subCustomer.email}`);
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
