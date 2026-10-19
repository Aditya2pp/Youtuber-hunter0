/**
 * lib/data.js
 * Demo creator dataset, constants, and utilities for YouTuber Finder.
 * Tailored for Video Editors, Thumbnail Artists, Agencies, and Brand Deals.
 */

export const UPI_ID = 'pixelcraft@naviaxis';
export const UPI_NAME = 'YouTuber Finder';
export const TELEGRAM_SUPPORT = 'https://t.me/Pixel_Craft0';
export const TELEGRAM_HANDLE = '@Pixel_Craft0';

export const NICHES = [
  'Tech',
  'Gaming',
  'Entertainment',
  'Education',
  'Vlog',
  'Finance',
];

export const COUNTRIES = [
  'All Countries',
  'India',
  'International',
];
export const REGIONS = COUNTRIES;
export const LANGS = COUNTRIES;

// Exact subscriber ranges requested by user:
// 1k to 5k , 5k to 10k , 10k to 20k , 20k to 50k , 50k to 100k , 100k to 200k
export const RANGES = [
  { id: 'any', label: 'All Subscribers', min: 0, max: Infinity },
  { id: '1k-5k', label: '1k to 5k', min: 1000, max: 5000 },
  { id: '5k-10k', label: '5k to 10k', min: 5000, max: 10000 },
  { id: '10k-20k', label: '10k to 20k', min: 10000, max: 20000 },
  { id: '20k-50k', label: '20k to 50k', min: 20000, max: 50000 },
  { id: '50k-100k', label: '50k to 100k', min: 50000, max: 100000 },
  { id: '100k-200k', label: '100k to 200k', min: 100000, max: 200000 },
  { id: '200k-plus', label: '200k+', min: 200000, max: Infinity },
];

export const PLANS = [
  {
    id: 'plan_30d',
    name: '30 Days Pass',
    price: 30,
    originalPrice: 199,
    days: 30,
    label: '₹30 / 30 days',
    discountBadge: 'Save ₹169',
    description: 'Instant client-hunting arsenal for freelance thumbnail designers.',
    features: [
      '100% Ad-Free Experience (No Ads)',
      'Unlimited Personalized DM Generator',
      'Unlimited High-Converting Cold Emails',
      'Full Access to 1,000+ YouTubers Directory',
      'Unlimited Shortlisting ("Save It")',
      '6 Fear-Free Pitch Angles & 3 Tone Modes',
    ],
  },
  {
    id: 'plan_1y',
    name: '1 Year Pro',
    price: 299,
    originalPrice: 999,
    days: 365,
    label: '₹299 / 1 year',
    badge: 'Popular',
    description: 'Complete 365-day client acquisition suite for serious designers & thumbnail agencies.',
    features: [
      'Everything in 30 Days Pass included',
      'Full 365 Days Unlimited Access (Save 83%)',
      '100% Zero Ads & Distraction-Free Flow',
      'Unlimited DMs & Cold Email Pitch Generation',
      'High-CTR & Time-Saving Outreach Angles',
      'Fresh Weekly Creator Leads & Instant Direct Links',
    ],
  },
];

export function fmt(n) {
  if (n === null || n === undefined) return '1k+';
  const str = String(n).trim().replace(/\+$/, '');
  const num = Number(str);
  if (isNaN(num)) {
    return str.endsWith('+') ? str : `${str}+`;
  }
  if (num >= 1000000) {
    const formatted = (num / 1000000).toFixed(1).replace(/\.0$/, '');
    return `${formatted}M+`;
  }
  if (num >= 1000) {
    const formatted = Math.round(num / 1000);
    return `${formatted}k+`;
  }
  return `${num}+`;
}

export const AVATAR_GRADIENTS = [
  'from-blue-600 to-indigo-700',
  'from-pink-500 to-rose-600',
  'from-amber-500 to-orange-600',
  'from-emerald-600 to-teal-700',
  'from-violet-600 to-purple-800',
  'from-red-500 to-rose-700',
  'from-sky-500 to-blue-600',
  'from-teal-600 to-cyan-700',
  'from-fuchsia-600 to-pink-600',
  'from-indigo-600 to-blue-600',
  'from-orange-500 to-amber-600',
  'from-purple-500 to-violet-700',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-teal-600',
  'from-violet-600 to-fuchsia-700',
  'from-blue-600 to-slate-800',
  'from-emerald-500 to-green-700',
  'from-indigo-600 to-purple-700',
];

export function getAvatarGradient(creator, index = 0) {
  if (creator?.avatarColor && creator.avatarColor.trim()) {
    return creator.avatarColor;
  }
  const idStr = String(creator?.id || creator?.name || index);
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash * 31 + idStr.charCodeAt(i)) % AVATAR_GRADIENTS.length;
  }
  return AVATAR_GRADIENTS[Math.abs(hash + index) % AVATAR_GRADIENTS.length];
}

export const CREATORS = [
  {
    id: 'c_sam',
    name: 'TechWithSam',
    verified: true,
    subs: 1200000,
    niche: 'Tech',
    region: 'International',
    link: 'https://youtube.com/@techwithsam',
    insta: 'https://instagram.com/techwithsam',
    email: 'business@techwithsam.com',
    avatarColor: 'from-blue-600 to-indigo-700',
  },
  {
    id: 'c_gaminggirl',
    name: 'GamingGirl',
    verified: true,
    subs: 856000,
    niche: 'Gaming',
    region: 'International',
    link: 'https://youtube.com/@gaminggirl',
    insta: 'https://instagram.com/gaminggirl_live',
    email: 'collab@gaminggirl.gg',
    avatarColor: 'from-pink-500 to-rose-600',
  },
  {
    id: 'c_mrbeastfan',
    name: 'MrBeastFan',
    verified: true,
    subs: 423000,
    niche: 'Entertainment',
    region: 'International',
    link: 'https://youtube.com/@creatorhub',
    insta: 'https://instagram.com/creatorhub',
    email: 'deals@creatorhub.co',
    avatarColor: 'from-amber-500 to-orange-600',
  },
  // 100K to 200K range
  {
    id: 'c7',
    name: 'Paisa Smart',
    verified: true,
    subs: 150000,
    niche: 'Finance',
    region: 'India',
    link: 'https://youtube.com/@paisasmart',
    insta: 'https://instagram.com/paisasmart',
    email: 'inquiries@paisasmart.in',
    avatarColor: 'from-emerald-600 to-teal-700',
  },
  // 50K to 100K range
  {
    id: 'c5',
    name: 'Code With Rohan',
    verified: true,
    subs: 92000,
    niche: 'Education',
    region: 'India',
    link: 'https://youtube.com/@codewithrohan',
    insta: 'https://instagram.com/codewithrohan',
    email: 'sponsorship@codewithrohan.dev',
    avatarColor: 'from-violet-500 to-purple-800',
  },
  {
    id: 'c2',
    name: 'Desi Daily Vlogs',
    verified: true,
    subs: 65000,
    niche: 'Vlog',
    region: 'India',
    link: 'https://youtube.com/@desidailyvlogs',
    insta: 'https://instagram.com/desidailyvlogs',
    email: 'collab@desidailyvlogs.com',
    avatarColor: 'from-red-500 to-rose-700',
  },
  // 20K to 50K range
  {
    id: 'c_gadgetvarta',
    name: 'Gadget Varta',
    verified: true,
    subs: 35000,
    niche: 'Tech',
    region: 'India',
    link: 'https://youtube.com/@gadgetvarta',
    insta: 'https://instagram.com/gadgetvarta',
    email: 'contact@gadgetvarta.in',
    avatarColor: 'from-sky-500 to-indigo-600',
  },
  // 10K to 20K range
  {
    id: 'c3',
    name: 'Daily Edu Shala',
    verified: true,
    subs: 18000,
    niche: 'Education',
    region: 'India',
    link: 'https://youtube.com/@dailyedushala',
    insta: 'https://instagram.com/dailyedushala',
    email: 'connect@dailyedushala.org',
    avatarColor: 'from-emerald-600 to-green-700',
  },
  // 5K to 10K range
  {
    id: 'c_designcraft',
    name: 'Design Craft Studio',
    verified: true,
    subs: 7800,
    niche: 'Education',
    region: 'International',
    link: 'https://youtube.com/@designcraft',
    insta: 'https://instagram.com/designcraft',
    email: 'work@designcraft.studio',
    avatarColor: 'from-fuchsia-600 to-pink-600',
  },
  // 1k to 5k range
  {
    id: 'c_aarav',
    name: 'Aarav Tech Shorts',
    verified: true,
    subs: 3400,
    niche: 'Tech',
    region: 'India',
    link: 'https://youtube.com/@aaravtechshorts',
    insta: 'https://instagram.com/aaravtech',
    email: 'collab@aaravtech.in',
    avatarColor: 'from-blue-500 to-teal-600',
  },
  {
    id: 'c_rohit_vlogs',
    name: 'Rohit Daily Vlogs',
    verified: false,
    subs: 2200,
    niche: 'Vlog',
    region: 'India',
    link: 'https://youtube.com/@rohitdailyvlogs',
    insta: 'https://instagram.com/rohitvlogsofficial',
    email: 'rohitvlogsteam@gmail.com',
    avatarColor: 'from-amber-500 to-rose-600',
  },
  {
    id: 'c_motionbeats',
    name: 'Motion Beats UI',
    verified: false,
    subs: 4600,
    niche: 'Education',
    region: 'International',
    link: 'https://youtube.com/@motionbeatsui',
    insta: 'https://instagram.com/motionbeatsui',
    email: 'contact@motionbeats.design',
    avatarColor: 'from-purple-500 to-indigo-600',
  },
  // 5k to 10k range additional
  {
    id: 'c_priya_cooks',
    name: 'Priya Lifestyle Vlogs',
    verified: true,
    subs: 8900,
    niche: 'Vlog',
    region: 'India',
    link: 'https://youtube.com/@priyalifestyle',
    insta: 'https://instagram.com/priyalifestyle',
    email: 'inquiries@priyalifestyle.com',
    avatarColor: 'from-rose-500 to-orange-500',
  },
  // 10k to 20k range additional
  {
    id: 'c_gameplay_hindi',
    name: 'Kabir Gaming Station',
    verified: true,
    subs: 15400,
    niche: 'Gaming',
    region: 'India',
    link: 'https://youtube.com/@kabirgaming',
    insta: 'https://instagram.com/kabirgaming_live',
    email: 'business@kabirgaming.in',
    avatarColor: 'from-cyan-500 to-blue-600',
  },
  // 20k to 50k range additional
  {
    id: 'c_edit_zone',
    name: 'CineCraft Edits',
    verified: true,
    subs: 42000,
    niche: 'Entertainment',
    region: 'International',
    link: 'https://youtube.com/@cinecraftcuts',
    insta: 'https://instagram.com/cinecraftcuts',
    email: 'collab@cinecraftcuts.com',
    avatarColor: 'from-violet-600 to-fuchsia-700',
  },
  // 100k to 200k range additional
  {
    id: 'c_sharma_tech',
    name: 'Aman Sharma Tech',
    verified: true,
    subs: 168000,
    niche: 'Tech',
    region: 'India',
    link: 'https://youtube.com/@amansharmatech',
    insta: 'https://instagram.com/amansharma_tech',
    email: 'aman@amansharmatech.in',
    avatarColor: 'from-blue-600 to-slate-800',
  },
  // 200K+ range
  {
    id: 'c1',
    name: 'Bharat Vlogs',
    verified: true,
    subs: 240000,
    niche: 'Vlog',
    region: 'India',
    link: 'https://youtube.com/@bharatvlogs',
    insta: 'https://instagram.com/bharatvlogs_official',
    email: 'deals@bharatvlogs.in',
    avatarColor: 'from-emerald-500 to-teal-700',
  },
  {
    id: 'c4',
    name: 'Tech Gyan Hindi',
    verified: true,
    subs: 480000,
    niche: 'Tech',
    region: 'India',
    link: 'https://youtube.com/@techgyanhindi',
    insta: 'https://instagram.com/techgyanhindi',
    email: 'business@techgyanhindi.in',
    avatarColor: 'from-blue-500 to-indigo-700',
  },
];
