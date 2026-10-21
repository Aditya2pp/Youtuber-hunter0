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
import { me, isPaid, plan, payment, submitPayment, subscribeStore } from '../../lib/store.js';
import { initScrollReveal } from '../../lib/scrollReveal.js';

export default function PlansPage({ onNavigate }) {
  const [userIsPaid, setUserIsPaid] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [lastPayment, setLastPayment] = useState(null);

  // Hidden by default until user clicks on ₹30 or ₹299 plan card
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [screenshotName, setScreenshotName] = useState('');
  const [screenshotData, setScreenshotData] = useState('');
  const [formError, setFormError] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Modals state
  const [showHowToBuyModal, setShowHowToBuyModal] = useState(false);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [screenshotModalConfirmed, setScreenshotModalConfirmed] = useState(false);
  const [screenshotModalError, setScreenshotModalError] = useState('');
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

  useEffect(() => {
    const timer = setTimeout(() => {
      initScrollReveal();
    }, 60);
    return () => clearTimeout(timer);
  }, [selectedPlan]);

  // Active plan checks
  const isPlanActive = Boolean(
    userIsPaid &&
    currentPlan &&
    currentPlan.active &&
    !currentPlan.expired &&
    currentPlan.expiresAt &&
    new Date(currentPlan.expiresAt).getTime() > Date.now()
  );

  const hasActiveAnnualPlan = Boolean(
    isPlanActive && (currentPlan?.planId === 'plan_1y' || currentPlan?.planId === '1y')
  );

  const hasActive30DayPlan = Boolean(
    isPlanActive && (currentPlan?.planId === 'plan_30d' || currentPlan?.planId === '30d')
  );

  const handleSelectPlan = (p) => {
    // If 1 Year Pro is active, prevent buying any plan
    if (hasActiveAnnualPlan) {
      setFormError('You already have an active 1 Year Pro plan! You have full access and do not need any other plan until it expires.');
      return;
    }
    // If 30-day plan is active, prevent re-buying 30-day plan
    if (p.id === 'plan_30d' && hasActive30DayPlan) {
      setFormError('You already have an active 30 Days Pass! You can buy again once your current 30-day period ends.');
      return;
    }
    setSelectedPlan(p);
    setFormError('');
    // Smoothly scroll down to the payment section directly below
    setTimeout(() => {
      if (paymentSectionRef.current) {
        paymentSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
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
      const err = 'Please upload a valid image receipt (PNG, JPG, or WEBP).';
      setFormError(err);
      setScreenshotModalError(err);
      return;
    }

    setScreenshotName(file.name);
    setFormError('');
    setScreenshotModalError('');

    const reader = new FileReader();
    reader.onload = () => {
      setScreenshotData(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadQR = () => {
    try {
      const svg = document.getElementById('payment-qr-svg');
      if (!svg) return;
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      canvas.width = 600;
      canvas.height = 600;
      img.onload = () => {
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, 600, 600);
          ctx.drawImage(img, 40, 40, 520, 520);
          const pngUrl = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngUrl;
          downloadLink.download = `YouTuberFinder-Payment-QR-Rs${selectedPlan?.price || '30'}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (err) {
      console.error('Error downloading QR code:', err);
    }
  };

  useEffect(() => {
    if (showHowToBuyModal || showScreenshotModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showHowToBuyModal, showScreenshotModal]);

  const handleOpenScreenshotModal = () => {
    setFormError('');
    setScreenshotModalError('');
    setScreenshotModalConfirmed(false);
    const currentUser = me();
    if (!currentUser || currentUser.isGuest) {
      setFormError('Please log in or sign up first so your plan can be activated for your account.');
      return;
    }
    setShowScreenshotModal(true);
  };

  const handleOpenHowToBuy = () => {
    setShowHowToBuyModal(true);
  };

  const handleConfirmDone = async (e) => {
    if (e) e.preventDefault();
    setScreenshotModalError('');

    if (!screenshotData) {
      setScreenshotModalError('Payment screenshot is mandatory. Please upload your payment receipt before submitting.');
      return;
    }

    const currentUser = me();
    if (!currentUser || currentUser.isGuest) {
      setShowScreenshotModal(false);
      setFormError('Please log in or sign up first so your plan can be activated for your account.');
      return;
    }

    setIsProcessing(true);

    try {
      // Instantly activates the plan
      await submitPayment({
        plan: selectedPlan.id,
        amount: selectedPlan.price,
        screenshotName,
        screenshotData,
      });

      setIsProcessing(false);
      // Morphs directly inside the bottom popup into the confirmation screen!
      setScreenshotModalConfirmed(true);
    } catch (err) {
      setIsProcessing(false);
      setScreenshotModalError(err.message || 'Error processing payment.');
    }
  };

  // Direct UPI URL for redirecting directly into GPay, PhonePe, Paytm, etc.
  const upiUrl = selectedPlan
    ? `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(UPI_NAME)}&am=${selectedPlan.price}&cu=INR&tn=${encodeURIComponent(`YF-${selectedPlan.name.replace(/\s+/g, '')}`)}`
    : `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(UPI_NAME)}&am=30&cu=INR&tn=YF-30Days`;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ========================================================
          HOW TO BUY SUBSCRIPTION MODAL (FIXED BOTTOM SHEET POPUP)
         ======================================================== */}
      {showHowToBuyModal && (
        <div
          onClick={() => setShowHowToBuyModal(false)}
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:pb-3 sm:px-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-white rounded-t-[28px] sm:rounded-[28px] p-4 sm:p-5 shadow-2xl border-t-2 sm:border-2 border-neutral-900 text-left animate-bottom-sheet overflow-hidden select-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE3]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#FF3358] border border-rose-200 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-[#FF3358]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18h6" />
                    <path d="M10 22h4" />
                    <path d="M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 6h8c1.5-1.5 3-3.5 3-6a7 7 0 0 0-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-neutral-950 leading-tight">
                    How To Buy Subscription
                  </h3>
                  <p className="text-[11px] text-neutral-500 font-medium leading-tight">
                    4 quick steps to activate your plan:
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHowToBuyModal(false)}
                className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center font-bold text-xs cursor-pointer transition-colors shrink-0"
                title="Close"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* 4 Compact Step Cards (Fixed non-scrollable 2x2 grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-3">
              {/* Step 1 */}
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#FAF6F2] border border-[#EAE3DB]">
                <div className="w-5 h-5 rounded-md bg-neutral-950 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div className="min-w-0">
                  <strong className="block font-black text-neutral-950 text-xs mb-0.5">
                    Scan or Download QR
                  </strong>
                  <p className="text-[11px] text-neutral-600 font-medium leading-tight">
                    Scan QR code on screen or tap "Download QR Code".
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#FAF6F2] border border-[#EAE3DB]">
                <div className="w-5 h-5 rounded-md bg-neutral-950 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div className="min-w-0">
                  <strong className="block font-black text-neutral-950 text-xs mb-0.5">
                    Pay via Any UPI App
                  </strong>
                  <p className="text-[11px] text-neutral-600 font-medium leading-tight truncate">
                    Pay ₹{selectedPlan?.price || '30'} to <span className="font-mono font-bold text-neutral-900">{UPI_ID}</span>.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#FAF6F2] border border-[#EAE3DB]">
                <div className="w-5 h-5 rounded-md bg-neutral-950 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div className="min-w-0">
                  <strong className="block font-black text-neutral-950 text-xs mb-0.5">
                    Take Screenshot
                  </strong>
                  <p className="text-[11px] text-neutral-600 font-medium leading-tight">
                    Capture payment confirmation receipt screenshot.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-rose-50/70 border border-rose-200">
                <div className="w-5 h-5 rounded-md bg-[#FF3358] text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  4
                </div>
                <div className="min-w-0">
                  <strong className="block font-black text-neutral-950 text-xs mb-0.5">
                    Submit & Activate
                  </strong>
                  <p className="text-[11px] text-neutral-600 font-medium leading-tight">
                    Tap "Payment Complete" below, attach receipt & done!
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Button */}
            <button
              type="button"
              onClick={() => setShowHowToBuyModal(false)}
              className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-black text-white bg-neutral-950 hover:bg-neutral-800 shadow-md transition-all active:scale-95 cursor-pointer mt-1"
            >
              Samajh Gaya / Proceed To Pay →
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          MANDATORY SCREENSHOT SUBMISSION & IN-PLACE CONFIRMATION POPUP (FIXED BOTTOM SHEET)
         ======================================================== */}
      {showScreenshotModal && (
        <div
          onClick={() => setShowScreenshotModal(false)}
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:pb-3 sm:px-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-white rounded-t-[28px] sm:rounded-[28px] p-4 sm:p-5 shadow-2xl border-t-2 sm:border-2 border-neutral-900 text-left animate-bottom-sheet overflow-hidden select-none"
          >
            {screenshotModalConfirmed ? (
              /* ========================================================
                 CONFIRMATION VIEW (MORPHED IN-PLACE IN BOTTOM SHEET)
                 ======================================================== */
              <div className="text-center py-2">
                <div className="w-14 h-14 mx-auto mb-2.5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 flex items-center justify-center text-emerald-600 shadow-sm">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>

                <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 inline-block mb-1.5">
                  Payment Submitted & Verified
                </span>

                <h3 className="text-base sm:text-lg font-black text-neutral-950 mb-1">
                  Plan Activated Instantly!
                </h3>

                <p className="text-[11px] sm:text-xs text-neutral-600 font-medium leading-relaxed max-w-xs mx-auto mb-4">
                  Receipt for <strong className="text-neutral-950">{selectedPlan?.name || currentPlan?.name || 'Pro Plan'}</strong> (₹{selectedPlan?.price || '30'}) submitted! Your account is active with full creator leads and outreach access.
                </p>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowScreenshotModal(false);
                      setScreenshotModalConfirmed(false);
                      if (onNavigate) {
                        onNavigate('/dashboard/find');
                      } else if (typeof window !== 'undefined') {
                        window.location.hash = '#/dashboard/find';
                      }
                    }}
                    className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-black text-white bg-neutral-950 hover:bg-neutral-800 shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Browse YouTuber Directory →</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowScreenshotModal(false);
                      setScreenshotModalConfirmed(false);
                    }}
                    className="w-full py-1.5 text-xs font-bold text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer text-center block"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              /* ========================================================
                 UPLOAD FORM VIEW
                 ======================================================== */
              <>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE3]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-rose-50 text-[#FF3358] border border-rose-200 inline-block">
                        Mandatory
                      </span>
                      <h3 className="text-sm sm:text-base font-black text-neutral-950">
                        Submit Payment Screenshot
                      </h3>
                    </div>
                    <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
                      Plan: {selectedPlan?.name} (₹{selectedPlan?.price})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowScreenshotModal(false)}
                    className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center font-bold text-xs cursor-pointer transition-colors shrink-0"
                    title="Cancel"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                {/* Error banner inside modal (compact) */}
                {screenshotModalError && (
                  <div className="mt-2.5 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 shrink-0 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span className="truncate">{screenshotModalError}</span>
                  </div>
                )}

                {/* Upload Area (Compact & Non-Scrollable) */}
                <div className="relative my-3">
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />

                  {screenshotData ? (
                    <div className="flex items-center gap-3 p-2.5 rounded-xl border-2 border-emerald-500 bg-emerald-50/60 transition-colors">
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-emerald-300 bg-white shrink-0 shadow-xs">
                        <img src={screenshotData} alt="Receipt preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <div className="text-xs font-black text-emerald-800 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span className="truncate">{screenshotName || 'Screenshot attached'}</span>
                        </div>
                        <span className="text-[11px] text-neutral-500 font-semibold underline block mt-0.5">
                          Click to replace image
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-[#D8CFC5] hover:border-[#FF3358] bg-[#FAF6F2] transition-colors cursor-pointer">
                      <div className="w-10 h-10 rounded-xl bg-white border border-[#EAE3DB] flex items-center justify-center text-[#FF3358] shadow-xs shrink-0">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      </div>
                      <div className="text-left min-w-0">
                        <span className="text-xs font-black text-neutral-950 block leading-tight">
                          Click to Upload Payment Screenshot
                        </span>
                        <span className="text-[11px] text-neutral-500 font-medium block leading-tight mt-0.5">
                          Attach payment proof (PNG, JPG, or WEBP)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-[10px] sm:text-[11px] text-neutral-500 font-medium text-center mb-3">
                  Payment screenshot is mandatory to verify ₹{selectedPlan?.price} and instantly activate your plan.
                </p>

                {/* Bottom Buttons: Done & Cancel */}
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={handleConfirmDone}
                    disabled={isProcessing}
                    className="w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-black text-white bg-neutral-950 hover:bg-neutral-800 shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>Done (Submit & Activate)</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowScreenshotModal(false)}
                    className="w-full py-1.5 text-[11px] font-bold text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer text-center block"
                  >
                    Cancel / Go Back
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          ACTIVE MEMBERSHIP BANNER (When Plan is Active)
         ======================================================== */}
      {userIsPaid && currentPlan && (
        <div data-reveal="up" className={`p-4 sm:p-6 rounded-3xl bg-white border-2 shadow-sm card-hover-lift ${hasActiveAnnualPlan ? 'border-neutral-900 ring-4 ring-neutral-900/5' : 'border-emerald-500'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl text-white flex items-center justify-center shrink-0 shadow-sm ${hasActiveAnnualPlan ? 'bg-neutral-950' : 'bg-emerald-500'}`}>
                {hasActiveAnnualPlan ? (
                  <svg className="w-6 h-6 text-amber-300" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] uppercase font-black tracking-wider ${hasActiveAnnualPlan ? 'text-neutral-900' : 'text-emerald-700'}`}>
                    {hasActiveAnnualPlan ? 'Top Tier Active' : 'Active Membership'}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-neutral-950">
                  {currentPlan.name || 'Pro Membership'}
                </h3>
                <p className="text-xs text-neutral-500 font-medium mt-0.5 leading-relaxed">
                  Valid until:{' '}
                  <strong className="text-neutral-900">
                    {currentPlan.expiresAt ? new Date(currentPlan.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Active'}
                  </strong>
                </p>
              </div>
            </div>

            <div className="self-start sm:self-center">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black ${hasActiveAnnualPlan ? 'bg-neutral-950 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                {hasActiveAnnualPlan ? (
                  <>
                    <svg className="w-3.5 h-3.5 text-amber-300" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <span>1 Year Pro Active</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Full Access Active</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {hasActiveAnnualPlan && (
            <div className="mt-3.5 pt-3.5 border-t border-[#F0EAE3] text-xs text-neutral-600 font-medium flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              <span>
                <strong className="text-neutral-950">1 Year Pro Active:</strong> You have unlimited access to all 1,000+ creator directories and unlimited outreach generators until expiration.
              </span>
            </div>
          )}
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
          {hasActiveAnnualPlan 
            ? 'Your 1 Year Pro plan is currently active with full unlocked creator directory and pitch generator access.'
            : hasActive30DayPlan
            ? 'Your 30 Days Pass is active. You can upgrade to 1 Year Pro anytime.'
            : 'Select a plan below for instant UPI unlock.'}
        </p>
      </div>

      {/* ========================================================
          TWO PLAN CARDS (WITH ₹199 CUT TO ₹30)
         ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 max-w-4xl">
        {PLANS.map((p, idx) => {
          const isSelected = selectedPlan?.id === p.id;
          const is30Days = p.id === 'plan_30d';
          const isCurrentActive = isPlanActive && currentPlan?.planId === p.id;
          
          // Disable 30-day plan if 30-day plan is active OR 1-year is active
          // Disable 1-year plan if 1-year is active
          // When plan expires or is rejected, both plans re-enable ("pahle jaisa ho jaaye")
          const isPlanDisabled = is30Days
            ? (hasActiveAnnualPlan || hasActive30DayPlan)
            : hasActiveAnnualPlan;

          return (
            <div
              key={p.id}
              data-reveal="scale"
              onClick={() => {
                if (!isPlanDisabled) {
                  handleSelectPlan(p);
                }
              }}
              className={`rounded-3xl p-5 sm:p-7 flex flex-col justify-between border-2 transition-all relative bg-white card-hover-lift stagger-${idx + 1} ${
                isPlanDisabled
                  ? isCurrentActive
                    ? 'border-neutral-900 ring-2 ring-neutral-900/10 opacity-95 shadow-sm'
                    : 'border-[#EAE3DB] opacity-60 cursor-not-allowed bg-[#FAF6F2]'
                  : isSelected
                  ? 'border-[#FF3358] ring-4 ring-[#FF3358]/10 shadow-lg cursor-pointer'
                  : 'border-[#EAE3DB] hover:border-neutral-900 shadow-sm cursor-pointer hover:shadow-md'
              }`}
            >
              {/* Badge */}
              {is30Days && (
                <div className="absolute -top-3 right-4 sm:right-6 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-[#FF3358] text-white shadow-sm">
                  {hasActiveAnnualPlan
                    ? 'Included in 1 Year Pro'
                    : hasActive30DayPlan
                    ? 'Active Plan'
                    : 'Limited Deal (₹199 Cut)'}
                </div>
              )}
              {p.badge && !is30Days && (
                <div className="absolute -top-3 right-4 sm:right-6 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-neutral-900 text-white shadow-sm">
                  {isCurrentActive ? 'Your Active Plan' : p.badge}
                </div>
              )}

              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-xl font-black text-neutral-950">
                    {p.name}
                  </h3>
                  {isCurrentActive && (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                      Active
                    </span>
                  )}
                </div>

                <p className="text-xs text-neutral-500 font-medium mt-1 min-h-[30px] leading-relaxed">
                  {p.description}
                </p>

                {/* Price Display with ₹199 Cut */}
                <div className="my-4 sm:my-5 flex items-baseline gap-2 sm:gap-2.5 flex-wrap">
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
                  <span className="text-4xl sm:text-5xl font-black text-neutral-950 tabular-nums tracking-tight">
                    ₹{p.price}
                  </span>
                  <span className="text-xs text-neutral-500 font-bold">
                    / {p.days === 365 ? '1 year' : '30 days'}
                  </span>
                </div>

                {/* Features */}
                <ul className="space-y-2 text-xs text-neutral-700 font-semibold pt-3 border-t border-[#F0EAE3]">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <svg className="w-4 h-4 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span className="leading-tight">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Selection Button */}
              <div className="mt-6 sm:mt-8 pt-3 border-t border-[#F0EAE3]">
                {isPlanDisabled ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-3.5 px-4 rounded-2xl text-xs font-black bg-neutral-200 text-neutral-500 cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    {isCurrentActive ? (
                      <span>Active Plan (Till {currentPlan?.expiresAt ? new Date(currentPlan.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Expiry'})</span>
                    ) : hasActiveAnnualPlan ? (
                      <span>Covered in your 1 Year Pro Plan</span>
                    ) : (
                      <span>Plan Currently Active</span>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPlan(p);
                    }}
                    className={`w-full py-3.5 px-4 rounded-2xl text-xs font-black shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      isSelected
                        ? 'bg-[#FF3358] text-white shadow-md ring-2 ring-[#FF3358]/20'
                        : 'bg-neutral-950 text-white hover:bg-neutral-800'
                    }`}
                  >
                    <span>{isSelected ? `Selected: Pay ₹${p.price} Below ↓` : `Select ₹${p.price} Plan →`}</span>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <polyline points="19 12 12 19 5 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================
          PAYMENT SECTION: ONLY OPENS ONCE USER SELECTS AN AVAILABLE PLAN
         ======================================================== */}
      {selectedPlan && !hasActiveAnnualPlan && !(selectedPlan.id === 'plan_30d' && hasActive30DayPlan) && (
        <div
          ref={paymentSectionRef}
          id="payment-scene"
          className="mt-6 sm:mt-8 p-5 sm:p-8 rounded-[28px] sm:rounded-[36px] bg-white border-2 border-neutral-900 shadow-xl max-w-3xl animate-fadeIn"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 sm:pb-5 border-b border-[#F0EAE3] gap-2.5 mb-5 sm:mb-6">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-[#FF3358] block mb-0.5">
                Instant UPI Payment
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-neutral-950 tracking-tight">
                Pay ₹{selectedPlan.price} for {selectedPlan.name}
              </h3>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                <svg className="w-3.5 h-3.5 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span>Instant Activation</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                className="p-1 px-2.5 rounded-lg text-xs font-bold text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                title="Close payment section"
              >
                Close
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center">
            
            {/* LEFT: QR CODE + DOWNLOAD QR BUTTON */}
            <div className="md:col-span-5 flex flex-col items-center text-center">
              <div className="p-3.5 sm:p-4 bg-white rounded-3xl shadow-md border-2 border-[#EAE3DB] inline-block max-w-[220px]">
                <QRCodeSVG
                  id="payment-qr-svg"
                  value={upiUrl}
                  size={190}
                  level="H"
                  includeMargin={true}
                  className="w-full h-auto"
                />
              </div>
              <span className="text-xs font-bold text-neutral-800 mt-2.5 block leading-tight">
                Scan with any UPI App
              </span>
              <span className="text-[11px] text-neutral-400 font-semibold mt-0.5 block">
                (Google Pay, PhonePe, Paytm, BHIM, CRED)
              </span>

              {/* SCANNER DOWNLOAD BUTTON */}
              <button
                type="button"
                onClick={handleDownloadQR}
                className="mt-3.5 w-full max-w-[210px] py-2.5 px-4 rounded-xl text-xs font-black bg-white border-2 border-neutral-900 text-neutral-950 hover:bg-neutral-950 hover:text-white transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Download QR Code</span>
              </button>
            </div>

            {/* RIGHT: PLAN DETAILS, UPI ID, HOW TO BUY LINK, AND PAYMENT COMPLETE BUTTON */}
            <div className="md:col-span-7 space-y-4 sm:space-y-4">
              
              {/* Plan Amount Pill */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-50/60 border border-rose-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Selected Plan</span>
                  <span className="text-xl sm:text-2xl font-black text-neutral-950">₹{selectedPlan.price}</span>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-[#FF3358] text-white shadow-xs">
                  {selectedPlan.days === 365 ? '1 Year Pro' : '30 Days Pass'}
                </span>
              </div>

              {/* Official UPI ID box with copy button */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FAF6F2] border border-[#EAE3DB]">
                <span className="text-[11px] uppercase tracking-wider font-extrabold text-neutral-500 block mb-1">
                  Official UPI ID:
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm sm:text-base font-black text-neutral-950 select-all truncate">
                    {UPI_ID}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-white border border-[#EAE3DB] text-neutral-900 hover:border-black transition-colors shrink-0 shadow-xs cursor-pointer active:scale-95"
                  >
                    {copiedUpi ? 'Copied!' : 'Copy UPI'}
                  </button>
                </div>
              </div>

              {/* HOW TO BUY SUBSCRIPTION LINK (Opens modal with steps) */}
              <div className="flex items-center justify-start pt-0.5">
                <button
                  type="button"
                  onClick={handleOpenHowToBuy}
                  className="inline-flex items-center gap-2 text-xs font-black text-neutral-700 hover:text-[#FF3358] transition-colors cursor-pointer group"
                >
                  <span className="w-5 h-5 rounded-full bg-neutral-200 group-hover:bg-rose-100 text-neutral-800 group-hover:text-[#FF3358] flex items-center justify-center text-[11px] font-black transition-colors">
                    ?
                  </span>
                  <span className="underline decoration-dotted underline-offset-4">
                    How To Buy Subscription? (Click for Steps)
                  </span>
                </button>
              </div>

              {/* Error Message if guest / login needed */}
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold space-y-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{formError}</span>
                  </div>
                  {formError.includes('log in or sign up') && (
                    <div className="flex items-center gap-2 pt-1 pl-6">
                      <button
                        type="button"
                        onClick={() => onNavigate ? onNavigate('/login') : (window.location.hash = '#/login')}
                        className="px-3 py-1 bg-white border border-rose-300 text-rose-900 rounded-lg text-xs font-extrabold hover:bg-rose-100 cursor-pointer"
                      >
                        Go to Log In →
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigate ? onNavigate('/signup') : (window.location.hash = '#/signup')}
                        className="px-3 py-1 bg-[#FF3358] text-white rounded-lg text-xs font-extrabold hover:bg-[#FF1F48] cursor-pointer"
                      >
                        Create Free Account →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* BIG "PAYMENT COMPLETE" CONFIRMATION BUTTON (Opens Mandatory Screenshot Modal) */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleOpenScreenshotModal}
                  className="w-full py-4 px-6 rounded-2xl text-sm sm:text-base font-black text-white bg-neutral-950 hover:bg-neutral-800 shadow-xl transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Payment Complete</span>
                </button>
                <span className="text-[11px] text-neutral-500 font-semibold mt-1.5 block text-center">
                  Click to submit payment receipt screenshot & activate plan
                </span>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* FOOTER: TELEGRAM SUPPORT ONLY */}
      <div className="pt-6 border-t border-[#EAE3DB] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-600 font-semibold">
        <div className="flex items-center gap-2">
          <span>Official Support:</span>
          <a
            href="https://t.me/Pixel_Craft0"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-extrabold text-neutral-950 hover:text-[#229ED9] transition-colors"
          >
            <svg className="w-4 h-4 text-[#229ED9]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
            </svg>
            <span>t.me/Pixel_Craft0 (@Pixel_Craft0)</span>
          </a>
        </div>
        <span className="text-neutral-400 text-[11px]">Instant 24/7 assistance on Telegram</span>
      </div>
    </div>
  );
}
