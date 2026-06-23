import funding from '@/lib/Api/funding'
import { stripe } from '@/lib/stripe'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, ArrowRight, Mail } from 'lucide-react'
import { Button } from '@heroui/react'

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
      <div className="min-h-[80vh] flex items-center justify-center p-6 bg-gradient-to-br from-background via-background to-success/5 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-success/20 rounded-full blur-[120px] opacity-50 pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] opacity-50 pointer-events-none" />

        <div className="relative z-10 w-full max-w-lg">
          <div className="bg-background/60 backdrop-blur-xl border border-white/10 dark:border-white/5 shadow-2xl rounded-3xl p-8 sm:p-10 text-center transform transition-all duration-500 hover:scale-[1.01]">
            
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 bg-success/20 rounded-full animate-ping opacity-75" />
              <div className="relative flex items-center justify-center w-full h-full bg-success/10 rounded-full border border-success/30 shadow-[0_0_40px_rgba(34,197,94,0.3)]">
                <CheckCircle size={48} className="text-success" strokeWidth={1.5} />
              </div>
            </div>

            <h1 className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-success to-emerald-400 bg-clip-text text-transparent tracking-tight">
              Payment Successful!
            </h1>
            
            <p className="text-default-500 text-lg mb-8 leading-relaxed">
              Thank you for your generous contribution. We deeply appreciate your support.
            </p>

            <div className="bg-default-50/50 dark:bg-default-100/30 backdrop-blur-sm rounded-2xl p-5 mb-8 border border-default-200/50 text-left">
              <div className="flex items-center gap-3 mb-3 text-default-600">
                <Mail size={18} className="text-primary" />
                <span className="text-sm font-medium">Confirmation Sent To</span>
              </div>
              <p className="text-foreground font-semibold truncate text-lg">
                {customerEmail}
              </p>
              
              <div className="w-full h-px bg-divider my-4" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-default-500">Transaction ID</span>
                <span className="text-xs font-mono text-default-600 bg-default-200/50 px-2 py-1 rounded-md">
                  {session_id.slice(0, 16)}...
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                as={Link} 
                href="/" 
                color="primary" 
                variant="shadow"
                size="lg"
                className="w-full sm:w-auto font-medium rounded-xl group"
                endContent={<ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
              >
                Return to Home
              </Button>
            </div>
            
            <p className="mt-8 text-xs text-default-400">
              Need help? Contact our support at{' '}
              <a href="mailto:support@redhope.com" className="text-primary hover:underline transition-all">
                support@redhope.com
              </a>
            </p>
          </div>
        </div>
      </div>
    )
  }
}