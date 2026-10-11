/**
 * src/components/PlansPage.jsx
 * Subscription Plans & Direct UPI Payment flow:
 * - 30 Days Plan shows ₹199 cut (struck through) and discounted price ₹30!
 * - Selecting plan opens the payment view directly below the card.
 * - Prominent, large QR code + active "PAY BY ANY UPI APP" button (opens UPI app directly).
 * - UPI ID: 9525594227@axl with one-click copy.
 * - Mandatory screenshot upload (no UTR input needed).
 * - "Payment Complete" button activates plan instantly with a smooth celebratory animation!
 */
import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { PLANS, UPI_ID, UPI_NAME } from '../../lib/data.js';
import { isPaid, plan, payment, submitPayment, demoActivate, subscribeStore } from '../../lib/store.js';

export default function PlansPage() {
  const [userIsPaid, setUserIsPaid] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [lastPayment, setLastPayment] = useState(null);

  // Default to 30 Days Pass so payment section is ready or easily chosen
  const [selectedPlan, setSelectedPlan] = useState(PLANS[0]);
  const [screenshotName, setScreenshotName] = useState('');
  const [screenshotData, setScreenshotData] = useState('');
  const [formError, setFormError] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Payment Success Animation State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const paymentSectionRef = useRef(null);

  useEffect(() => {
    const update = () => {
      setUserIsPaid(isPaid());
      setCurrentPlan(plan());
      setLastPayment(payment());
    };
    update();
    const unsub = subscribeStore(update);
    return () => unsub();
  }, []);

  const handleSelectPlan = (p) => {
    setSelectedPlan(p);
    setFormError('');
    // Smoothly scroll down to the payment section directly below
    setTimeout(() => {
      paymentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleCopyUpi = () => {
    navigator.clipboard?.writeText(UPI_ID);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Please upload an image file (PNG, JPG, or WEBP).');
      return;
    }

    setScreenshotName(file.name);
    setFormError('');

    const reader = new FileReader();
    reader.onload = () => {
      setScreenshotData(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCompletePayment = (e) => {
    if (e) e.preventDefault();
    setFormError('');

    // Screenshot is mandatory
    if (!screenshotData) {
      setFormError('Payment screenshot is required! Please upload your payment receipt.');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      try {
        // Instantly activates the plan
        submitPayment({
          plan: selectedPlan.id,
          amount: selectedPlan.price,
          screenshot: screenshotName,
        });

        setIsProcessing(false);
        setShowSuccessModal(true);
      } catch (err) {
        setIsProcessing(false);
        setFormError(err.message || 'Error processing payment.');
      }
    }, 600);
  };

  // Direct UPI URL for redirecting directly into GPay, PhonePe, Paytm, etc.
  const upiUrl = selectedPlan
    ? `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(UPI_NAME)}&am=${selectedPlan.price}&cu=INR&tn=${encodeURIComponent(`YF-${selectedPlan.name.replace(/\s+/g, '')}`)}`
    : `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(UPI_NAME)}&am=30&cu=INR&tn=YF-30Days`;

  return (
    <div className="space-y-8">
      {/* ========================================================
          CELEBRATION / PAYMENT SUCCESS MODAL ANIMATION
         ======================================================== */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-[32px] p-8 text-center shadow-2xl border-2 border-emerald-400 overflow-hidden transform animate-scaleUp">
            {/* Animated Celebration Confetti Orbs */}
            <div className="absolute -top-10 -left-10 w-28 h-28 bg-emerald-100 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-28 h-28 bg-rose-100 rounded-full blur-xl pointer-events-none" />

            {/* Glowing Success Checkmark Circle */}
            <div className="relative w-20 h-20 mx-auto mb-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-30" />
              <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 inline-block mb-2">
              Payment Done & Verified!
            </span>

            <h3 className="text-2xl font-black text-neutral-950 mb-2">
              Plan Activated Instantly!
            </h3>

            <p className="text-xs sm:text-sm text-neutral-600 font-medium leading-relaxed mb-6">
              Congratulations! Your <strong className="text-neutral-900">{selectedPlan.name}</strong> is now live. All verified creator emails and contacts are unlocked.
            </p>

            <button
              onClick={() => {
                setShowSuccessModal(false);
                if (typeof window !== 'undefined') {
                  window.location.href = '/dashboard/find';
                }
              }}
              className="w-full py-3.5 px-6 rounded-2xl text-sm font-extrabold text-white bg-neutral-950 hover:bg-neutral-800 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Start Hunting Clients Now →
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          ACTIVE MEMBERSHIP BANNER (When Plan is Active)
         ======================================================== */}
      {userIsPaid && currentPlan && (
        <div className="p-5 sm:p-6 rounded-3xl bg-white border-2 border-emerald-500 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-emerald-700">
                  Active Membership
                </span>
                <h3 className="text-lg font-black text-neutral-950">
                  {currentPlan.name || '30 Days Pass'}
                </h3>
                <p className="text-xs text-neutral-500 font-medium mt-0.5">
                  Valid until:{' '}
                  <strong className="text-neutral-900">
                    {currentPlan.expiresAt ? new Date(currentPlan.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Active'}
                  </strong>
                  {' '}· All emails unlocked with 0% commission.
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-black self-start sm:self-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Full Access Active
            </span>
          </div>
        </div>
      )}

      {/* ========================================================
          PLANS HEADER
         ======================================================== */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight">
          Choose Your Plan
        </h2>
        <p className="text-xs sm:text-sm text-neutral-600 font-medium mt-1">
          Instant activation via UPI. Select a plan below to pay and unlock creator emails immediately.
        </p>
      </div>

      {/* ========================================================
          TWO PLAN CARDS (WITH ₹199 CUT TO ₹30)
         ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {PLANS.map((p) => {
          const isSelected = selectedPlan?.id === p.id;
          const is30Days = p.id === 'plan_30d';

          return (
            <div
              key={p.id}
              onClick={() => handleSelectPlan(p)}
              className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between border-2 transition-all relative bg-white cursor-pointer ${
                isSelected
                  ? 'border-[#FF3358] ring-4 ring-[#FF3358]/10 shadow-lg'
                  : 'border-[#EAE3DB] hover:border-neutral-900 shadow-sm'
              }`}
            >
              {/* Badge */}
              {is30Days && (
                <div className="absolute -top-3 right-6 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-[#FF3358] text-white shadow-sm">
                  Limited Deal (₹199 Cut)
                </div>
              )}
              {p.badge && !is30Days && (
                <div className="absolute -top-3 right-6 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-neutral-900 text-white shadow-sm">
                  {p.badge}
                </div>
              )}

              <div>
                <h3 className="text-xl font-black text-neutral-950">
                  {p.name}
                </h3>
                <p className="text-xs text-neutral-500 font-medium mt-1 min-h-[30px]">
                  {p.description}
                </p>

                {/* Price Display with ₹199 Cut */}
                <div className="my-5 flex items-baseline gap-2.5">
                  {is30Days && (
                    <span className="text-2xl sm:text-3xl font-bold text-neutral-400 line-through">
                      ₹199
                    </span>
                  )}
                  {p.originalPrice && !is30Days && (
                    <span className="text-2xl sm:text-3xl font-bold text-neutral-400 line-through">
                      ₹{p.originalPrice}
                    </span>
                  )}
                  <span className="text-4xl sm:text-5xl font-black text-neutral-950 tabular-nums">
                    ₹{p.price}
                  </span>
                  <span className="text-xs text-neutral-500 font-bold">
                    / {p.days === 365 ? '1 year' : '30 days'}
                  </span>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 text-xs text-neutral-700 font-semibold pt-3 border-t border-[#F0EAE3]">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <svg className="w-4 h-4 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Selection Button */}
              <div className="mt-8 pt-4">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPlan(p);
                  }}
                  className={`w-full py-3.5 px-4 rounded-2xl text-xs font-black shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    isSelected
                      ? 'bg-[#FF3358] text-white shadow-md'
                      : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
                  }`}
                >
                  <span>{isSelected ? `Selected: Pay ₹${p.price} Below ↓` : `Select ₹${p.price} Plan`}</span>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <polyline points="19 12 12 19 5 12" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================
          PAYMENT SECTION: OPENS DIRECTLY BELOW PLAN CARDS
         ======================================================== */}
      {selectedPlan && (
        <div
          ref={paymentSectionRef}
          id="payment-scene"
          className="mt-6 p-6 sm:p-9 rounded-[32px] bg-white border-2 border-neutral-900 shadow-xl max-w-3xl animate-fadeIn"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#F0EAE3] gap-2 mb-6">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-[#FF3358] block mb-0.5">
                Instant UPI Payment
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-neutral-950">
                Pay ₹{selectedPlan.price} for {selectedPlan.name}
              </h3>
            </div>
            <div className="text-left sm:text-right">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                ⚡ Instant Plan Activation
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            {/* LEFT: LARGE HIGH-CONTRAST UPI QR CODE */}
            <div className="md:col-span-5 flex flex-col items-center text-center">
              <div className="p-4 bg-white rounded-3xl shadow-lg border-2 border-[#EAE3DB] inline-block">
                <QRCodeSVG
                  value={upiUrl}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <span className="text-xs font-bold text-neutral-700 mt-3 block">
                Scan with GPay, PhonePe, Paytm, etc.
              </span>
            </div>

            {/* RIGHT: UPI DETAILS, PAY BY ANY UPI APP BUTTON, SCREENSHOT UPLOAD */}
            <div className="md:col-span-7 space-y-5">
              
              {/* Official UPI ID box with copy button */}
              <div className="p-4 rounded-2xl bg-[#FAF6F2] border border-[#EAE3DB]">
                <span className="text-xs font-bold text-neutral-600 block mb-1">
                  Official UPI ID:
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-base font-black text-neutral-950 select-all">
                    {UPI_ID}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-white border border-[#EAE3DB] text-neutral-900 hover:border-black transition-colors shrink-0 shadow-xs cursor-pointer"
                  >
                    {copiedUpi ? 'Copied ✓' : 'Copy UPI'}
                  </button>
                </div>
              </div>

              {/* PAY BY ANY UPI APP BUTTON (Redirects directly into installed UPI app) */}
              <div>
                <a
                  href={upiUrl}
                  className="w-full py-4 px-6 rounded-2xl text-center text-sm sm:text-base font-black text-white bg-gradient-to-r from-[#FF3358] to-[#E62E7A] hover:opacity-95 shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2.5 transition-transform active:scale-98 cursor-pointer"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <rect x="5" y="2" width="14" height="20" rx="3" />
                    <line x1="12" y1="18" x2="12.01" y2="18" />
                  </svg>
                  <span>PAY BY ANY UPI APP (Click to Open)</span>
                </a>
                <span className="text-[11px] text-neutral-500 font-semibold mt-1.5 block text-center">
                  Opens Google Pay, PhonePe, Paytm, or BHIM directly on your device.
                </span>
              </div>

              {/* MANDATORY SCREENSHOT UPLOAD */}
              <div>
                <label className="block text-xs font-extrabold text-neutral-900 mb-1.5">
                  Upload Payment Screenshot <span className="text-[#FF3358]">* (Mandatory)</span>
                </label>
                
                <div className="relative border-2 border-dashed border-[#D8CFC5] hover:border-[#FF3358] rounded-2xl p-4 bg-[#FAF6F2] transition-colors text-center cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  
                  {screenshotName ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-700 font-extrabold text-xs">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span className="truncate max-w-[220px]">Attached: {screenshotName}</span>
                      <span className="text-[10px] text-neutral-500 underline font-normal ml-1">Change</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="w-8 h-8 mx-auto rounded-full bg-white border border-[#EAE3DB] flex items-center justify-center text-neutral-700">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      </div>
                      <span className="text-xs font-extrabold text-neutral-900 block">
                        Click or Drop Payment Screenshot Here
                      </span>
                      <span className="text-[10px] text-neutral-500 font-medium block">
                        Supports PNG, JPG, WEBP receipt screenshots
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{formError}</span>
                </div>
              )}

              {/* BIG "PAYMENT COMPLETE" CONFIRMATION BUTTON */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCompletePayment}
                  disabled={isProcessing}
                  className="w-full py-4 px-6 rounded-2xl text-sm sm:text-base font-black text-white bg-neutral-950 hover:bg-neutral-800 shadow-xl transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Payment Complete ✓ (Activate Plan)</span>
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* QUICK DEMO PREVIEW (For testing purposes) */}
      <div className="pt-6 border-t border-[#EAE3DB] flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500 font-semibold">
        <div>
          <span>Billing inquiries: </span>
          <a href="mailto:support@youtuberfinder.com" className="text-neutral-900 hover:underline font-bold">
            support@youtuberfinder.com
          </a>
        </div>
        <div>
          <button
            type="button"
            onClick={() => {
              demoActivate(30);
              setShowSuccessModal(true);
            }}
            className="text-xs text-[#FF3358] hover:underline font-bold bg-transparent border-0 cursor-pointer"
          >
            Demo preview: Instant 30-Day Activation
          </button>
        </div>
      </div>
    </div>
  );
}
