/**
 * lib/data.js
 * Demo creator dataset, constants, and utilities for YouTuber Finder.
 * Tailored for Video Editors, Thumbnail Artists, Agencies, and Brand Deals.
 */

export const UPI_ID = '9525594227@axl';
export const UPI_NAME = 'YouTuber Finder';

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
    label: '₹30 for 30 days',
    discountBadge: '₹199 Cut to ₹30',
    description: 'Perfect for video editors & thumbnail designers hunting their first 5-10 clients.',
    features: [
      'Unlocks all direct creator emails',
      'Verified Instagram & channel links',
      'Unlimited saved creators with "Save It"',
      'Instant creator directory access',
      'One-time direct UPI payment',
    ],
  },
  {
    id: 'plan_1y',
    name: '1 Year Pro',
    price: 299,
    originalPrice: 999,
    days: 365,
    label: '₹299 for 1 year',
    badge: 'Popular',
    description: 'Best for agencies, freelance editors, and brands running ongoing campaigns.',
    features: [
      'Unlocks all channel emails & direct inboxes',
      'Direct Instagram & channel links',
      'Unlimited saved creators & CSV export',
      'Save 83% compared to monthly',
      'Priority verification & weekly fresh leads',
    ],
  },
];

export function fmt(n) {
  if (n === null || n === undefined) return '0';
  const num = Number(n);
  if (num >= 1000000) {
    const formatted = (num / 1000000).toFixed(1).replace(/\.0$/, '');
    return `${formatted}M`;
  }
  if (num >= 1000) {
    const formatted = (num / 1000).toFixed(1).replace(/\.0$/, '');
    return `${formatted}K`;
  }
  return num.toString();
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
    avatarColor: 'from-amber-600 to-yellow-700',
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
