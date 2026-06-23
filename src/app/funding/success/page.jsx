import funding from '@/lib/Api/funding'
import { stripe } from '@/lib/stripe'
import { redirect } from 'next/navigation'


export default async function Success({ searchParams }) {
  const { session_id } = await searchParams

  if (!session_id)
    throw new Error('Please provide a valid session_id (`cs_test_...`)')

  const {
    status,
    customer_details: { email: customerEmail },
    metadata,
    payment_intent
  } = await stripe.checkout.sessions.retrieve(session_id, {
    expand: ['line_items', 'payment_intent']
  })

  const fundingRes = await funding({ 
    sessionID: session_id, 
    userId: metadata?.userId, 
    amount: Number(metadata?.amount || 0), 
    stripeId: payment_intent?.id 
  });

  if (status === 'open') {
    return redirect('/funding')
  }

  if (status === 'complete') {
    return (
      <section id="success">
        <p>
          We appreciate your business! A confirmation email will be sent to{' '}
          {customerEmail}. If you have any questions, please email{' '}
          <a href="mailto:orders@example.com">orders@example.com</a>.
        </p>
      </section>
    )
  }
}