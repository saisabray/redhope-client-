import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe';


export async function POST(req) {
  try {
    const data = await req.json();
    const { amount, userId } = data;

    const headersList = await headers()
    const origin = headersList.get('origin')

    // Create Checkout Sessions from body params.
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'RedHope Donation',
            },
            unit_amount: amount * 100, // Stripe expects amounts in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/funding/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/funding`,
      metadata: {
        userId: userId || 'anonymous',
        amount: amount.toString()
      }
    });
    
    // Return JSON with the session URL instead of redirecting directly
    // This allows the client-side fetch to handle the redirect properly
    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: err.statusCode || 500 }
    )
  }
}