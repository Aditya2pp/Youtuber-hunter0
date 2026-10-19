/**
 * lib/outreachTemplates.js
 * 6 High-Converting, Confident Outreach Templates for YOUTUBE THUMBNAIL DESIGNERS.
 * 
 * Rules:
 * - Only 1 template offers a test sample; others focus on CTR growth, saving time, mobile contrast, packaging audits, and brand authority.
 * - Confident, fear-free language that designers can send proudly without sounding desperate or cheap.
 * - Personalized strictly with the creator's channel name (no niche/subscriber counts).
 * - 3 Tone Variations: Professional, Direct Approach, With Portfolio.
 */

export const OUTREACH_TEMPLATES = [
  {
    id: 1,
    title: 'Sample Concept Test',
    badge: 'Low Friction',
    description: 'A confident, low-friction offer to put together 1 test thumbnail concept for their upcoming upload.',
    shortMessage: {
      professional: (name) =>
        `Hi ${name}, I really respect the dedication and production you put into your channel! I'm a YouTube thumbnail designer specializing in click-through rate psychology and mobile contrast. I'd love to share 1 custom thumbnail concept for your upcoming upload so you can see how stronger facial framing and lighting can elevate your CTR. Would you be open to a quick preview?`,
      direct: (name) =>
        `Hey ${name}! Straight to the point: I design high-converting YouTube thumbnails that routinely beat 10% CTR. I want to send over 1 custom concept for your next upload so you can judge the quality firsthand. What is your next video topic?`,
      portfolio: (name) =>
        `Hi ${name}, huge fan of your channel! I'm a dedicated YouTube thumbnail artist. You can review my client work and before/after designs here: [Your Portfolio Link]. I'd love to create 1 sample concept for your next video so you can see the difference. Let me know!`,
    },
    email: {
      subject: (name) => `Custom thumbnail concept for ${name}'s next video`,
      professional: (name) =>
`Hi ${name},

I've been following your channel and genuinely appreciate the care and production quality you put into your uploads.

In today's crowded YouTube feed, even top-tier videos lose 40% of potential viewers simply because the thumbnail doesn't win the click in the first 0.5 seconds.

I design high-converting YouTube thumbnails that leverage:
• Mobile-first composition with crisp subject separation
• 3D facial expressions and emotion framing that trigger curiosity
• Clean visual hierarchy without clutter or text overload

I'd love to put together 1 custom thumbnail concept for your upcoming upload so you can run an A/B test in YouTube Studio and evaluate the CTR lift.

Would you be open to reviewing a concept this week?

Best regards,
[Your Name]
[Your Contact / Portfolio Link]`,
      direct: (name) =>
`Hey ${name},

Cutting straight to the chase: I help YouTube creators boost their impressions-to-view ratio by engineering high-CTR thumbnails that stop the scroll.

I'd like to share 1 custom thumbnail concept for your next upload. If you like the direction and it beats your average CTR, we can explore an ongoing partnership.

Send me your next video title and I'll send over the concept.

Cheers,
[Your Name]
[Your WhatsApp / Telegram]`,
      portfolio: (name) =>
`Hi ${name},

Love the consistency and energy on your channel!

I'm a YouTube packaging specialist. You can inspect my recent client designs and CTR results here:
👉 [Your Portfolio Link]

My thumbnails focus strictly on click psychology, bold framing, and clean focal points that stand out on mobile feeds.

I would love to prepare 1 custom thumbnail concept for your upcoming video so you can see how our styles align.

Let me know if I can put together a draft for your next title!

Warm regards,
[Your Name]`
    }
  },
  {
    id: 2,
    title: 'CTR & Mobile Feed Standout',
    badge: '10%+ CTR Focus',
    description: 'Highlights mobile feed competition, color contrast, and turning browse impressions into views.',
    shortMessage: {
      professional: (name) =>
        `Hello ${name}, your video topics are fantastic! Over 75% of YouTube impressions happen on small mobile screens where thumbnails compete with dozens of recommendations. I design high-contrast, focal-point thumbnails that stop the scroll and turn browse impressions into clicks. Would you be open to discussing your upcoming packaging?`,
      direct: (name) =>
        `Hey ${name}! Quick observation: your video content is top-tier, but boosting your thumbnail contrast and facial lighting could easily add 15-20% more views from browse feeds. Let's connect to review a few packaging ideas for your next release!`,
      portfolio: (name) =>
        `Hey ${name}! I help creators elevate average 4% CTR up to 8-11% through mobile-first thumbnail composition. Take a look at some before-and-after results here: [Your Portfolio Link]. Open to a brief chat about your next upload?`,
    },
    email: {
      subject: (name) => `Boosting mobile CTR and browse views on ${name}`,
      professional: (name) =>
`Hi ${name},

I hope you're having a productive week.

I've been studying your channel's recent uploads. Your content delivery is strong, but on mobile feeds—where 75%+ of audiences browse—thumbnails often compete with dozens of saturated recommendations.

I specialize in mobile-optimized YouTube thumbnails:
• Crisp subject separation with 3D depth and rim lighting
• Bold typography (max 3-4 words) that reads instantly on small screens
• Clean focal points that create immediate visual intrigue

Simply refining your visual contrast and focal composition can often unlock an immediate 15-25% lift in browse traffic.

I'd welcome the chance to share a few specific packaging ideas for your next release.

Let me know if you'd be open to a quick discussion!

Best,
[Your Name]
[Your Portfolio Link]`,
      direct: (name) =>
`Hey ${name},

Quick question: are you happy with your channel's current impression-to-view ratio?

Most creators lose thousands of views because their thumbnails get washed out in dark-mode mobile feeds. I design high-contrast thumbnails engineered specifically to stop the scroll and boost your CTR above 10%.

Let's connect this week to discuss how we can give your next upload maximum feed presence.

Best,
[Your Name]`,
      portfolio: (name) =>
`Hi ${name},

Big fan of your channel!

I'm a thumbnail designer specializing in high-CTR visual packaging. Here are before-and-after samples of thumbnails I've designed:
👉 [Your Portfolio Link]

I'd love to partner with you to give your upcoming uploads the clean, punchy packaging they deserve.

Are you open to a brief chat about your next video?

Warm regards,
[Your Name]`
    }
  },
  {
    id: 3,
    title: 'Time Saving & Reliable Partner',
    badge: 'Save 4+ Hours',
    description: 'Relieves creator fatigue by taking thumbnail stress off their plate with 24-hr turnaround.',
    shortMessage: {
      professional: (name) =>
        `Hi ${name}, I know how exhausting it is to spend days filming and editing, only to lose another 3-4 hours stressing over thumbnail design right before upload. I work as a dedicated thumbnail designer for creators, delivering high-CTR concepts within 24 hours so you never have to worry about packaging. Let's connect!`,
      direct: (name) =>
        `Hey ${name}! You should be spending your energy on great video concepts, not fighting Photoshop at 2 AM. I handle full thumbnail design with guaranteed 24-hour delivery. Would you be open to offloading thumbnail design on your next video?`,
      portfolio: (name) =>
        `Hey ${name}! I partner with active creators to completely eliminate thumbnail stress with fast 24-hour turnaround. Check out my client workflow and portfolio here: [Your Portfolio Link]. Let's chat about streamlining your upload schedule!`,
    },
    email: {
      subject: (name) => `Save 4+ hours on ${name}'s thumbnails (Fast 24-hr turnaround)`,
      professional: (name) =>
`Hi ${name},

Creating consistent, high-quality YouTube videos takes immense effort. After writing, recording, and editing, spending another 3 to 4 hours stressing over thumbnail design can quickly lead to creator fatigue.

I work as a dependable thumbnail designer for active creators:
• Fast 24-hour delivery on all thumbnail requests
• Multiple concept variations per video
• Unlimited rapid revisions until you are 100% satisfied

By handing off thumbnail design, you reclaim valuable hours to focus purely on ideation and recording, while knowing your packaging is handled at the highest standard.

Would you be open to exploring how we can streamline your upcoming upload schedule?

Warm regards,
[Your Name]
[Your Portfolio Link]`,
      direct: (name) =>
`Hey ${name},

You should be spending your energy on great video ideas and filming, not staring at an empty Photoshop canvas right before upload.

I can take over your entire thumbnail workflow with reliable 24-hour deliveries and high-CTR designs.

Would you be open to testing this workflow on your upcoming video?

Best,
[Your Name]`,
      portfolio: (name) =>
`Hi ${name},

I love your channel's work and consistency!

I help creators scale their uploads without packaging stress. Take a look at my thumbnail portfolio and turnaround track record here:
👉 [Your Portfolio Link]

Let's partner up on your upcoming video lineup and save you 15+ hours this month.

Let me know what you think!

Cheers,
[Your Name]`
    }
  },
  {
    id: 4,
    title: 'Curiosity Gap & Click Psychology',
    badge: 'Viral Pacing',
    description: 'Focuses on visual storytelling that hooks viewer curiosity without giving away the ending.',
    shortMessage: {
      professional: (name) =>
        `Hello ${name}, your storytelling is fantastic! The biggest factor in YouTube recommending videos is creating a visual curiosity gap between the thumbnail and title—giving viewers an irresistible reason to click. I specialize in story-driven thumbnail packaging. Would love to share a few insights for your upcoming projects!`,
      direct: (name) =>
        `Hey ${name}! Great videos, but don't give away the whole punchline in the thumbnail. Creating an incomplete visual story hooks viewers 2x faster. I'd love to share 2-3 specific packaging ideas that could boost clicks on your next release. Interested?`,
      portfolio: (name) =>
        `Hey ${name}! I design curiosity-gap thumbnails engineered to spark viewer intrigue in under 1 second. Here are recent examples: [Your Portfolio Link]. Let's connect to explore packaging for your next upload!`,
    },
    email: {
      subject: (name) => `Story-driven thumbnail strategy for ${name}`,
      professional: (name) =>
`Hi ${name},

Your content ideas and consistency are admirable.

When analyzing viral YouTube uploads, the best-performing thumbnails don't just look pretty—they tell an incomplete story that forces the viewer's brain to click to find the answer.

I design curiosity-driven YouTube thumbnails that:
• Complement your title without redundantly repeating words
• Highlight relatable emotional stakes and high-contrast facial cues
• Spark instant intrigue in under 1 second

Applying this storytelling framework to your packaging can reliably increase your impression click-through rate.

I'd be glad to share a few specific curiosity-hook concepts tailored for your channel.

Would you be open to discussing your upcoming titles?

Sincerely,
[Your Name]
[Your Portfolio Link]`,
      direct: (name) =>
`Hey ${name},

Your videos deserve more clicks than they're currently getting. 

I make custom thumbnails using curiosity-gap framing that routinely helps channels move from 4-5% CTR to 8-12%.

I'd love to share a couple of visual ideas for your next release to show you what I mean.

Send me your next video title and let's discuss!

Cheers,
[Your Name]`,
      portfolio: (name) =>
`Hi ${name},

Love your uploads!

I'm a YouTube packaging specialist. Here are examples of thumbnails I've designed that generated millions of impressions:
👉 [Your Portfolio Link]

I would love to collaborate on your upcoming releases and implement this curiosity-driven framework.

Looking forward to hearing your thoughts!

Best,
[Your Name]`
    }
  },
  {
    id: 5,
    title: 'Packaging & Contrast Audit',
    badge: 'Quick Observations',
    description: 'Constructive observations on facial lighting, typography, and hierarchy that boost CTR.',
    shortMessage: {
      professional: (name) =>
        `Hi ${name}, I've been studying your channel's recent uploads. Your viewer retention is clearly solid, but I noticed 2 quick visual tweaks to your font hierarchy and subject framing that could significantly increase your click-through rate. Happy to share these quick observations if you're interested!`,
      direct: (name) =>
        `Hey ${name}! Took a look at your latest 3 videos—great production. I spotted 2 packaging adjustments that could stop more scrolling viewers on mobile. Can I share a quick 1-minute breakdown with you?`,
      portfolio: (name) =>
        `Hi ${name}! I did a quick audit of your channel's feed presence and have 2 specific suggestions to increase your CTR on browse feeds. You can see my design standard here: [Your Portfolio Link]. Let me know if you'd like me to send the notes over!`,
    },
    email: {
      subject: (name) => `2 Quick thumbnail observations for ${name}`,
      professional: (name) =>
`Hi ${name},

I was reviewing your channel feed today and wanted to commend you on the quality of your recent uploads.

While studying your video packaging alongside competing recommendations, I noticed two quick visual opportunities:
1. Subject separation: Enhancing rim-lighting around your subject creates immediate 3D depth against dark backgrounds.
2. Text minimalism: Keeping on-screen text strictly under 3-4 words ensures total readability on mobile feeds.

Making these subtle adjustments typically results in an immediate 10-20% bump in click-through rates.

I'd be happy to share a quick mock-up demonstrating how these principles apply to your content.

Let me know if you'd like to see it!

Best regards,
[Your Name]
[Your Portfolio Link]`,
      direct: (name) =>
`Hey ${name},

I noticed a couple of simple tweaks on your latest thumbnails that could easily boost your CTR and recommendation traffic.

I work full-time as a YouTube thumbnail designer and would love to share a couple of mockups tailored for your next video.

Are you open to seeing a quick breakdown?

Cheers,
[Your Name]`,
      portfolio: (name) =>
`Hi ${name},

Huge fan of your channel!

I specialize in channel packaging audits that identify low-hanging CTR opportunities. You can see my design standard and client results here:
👉 [Your Portfolio Link]

I'd love to share a few customized packaging notes for ${name}.

Let me know if you'd be open to reviewing them!

Warmly,
[Your Name]`
    }
  },
  {
    id: 6,
    title: 'Brand Authority & Premium Polish',
    badge: 'Sponsor Ready',
    description: 'Elevates channel authority with agency-grade 3D cutouts, premium color grading, and sleek aesthetic.',
    shortMessage: {
      professional: (name) =>
        `Hello ${name}, your content is top quality! As channels scale, having clean, high-authority thumbnail branding makes a huge difference in attracting high-paying brand deals and standing out as an industry leader. I craft premium, 3D-polished thumbnail packaging. Would love to connect and discuss your upcoming video lineup!`,
      direct: (name) =>
        `Hey ${name}! High-end channels deserve high-end thumbnails. Upgrading to clean, agency-level packaging builds instant authority and boosts your sponsorship value. Let's discuss elevating your channel packaging!`,
      portfolio: (name) =>
        `Hey ${name}! I craft premium, high-aesthetic thumbnail branding for creators who want an authority look. Explore my recent client work here: [Your Portfolio Link]. Let me know if you'd like to collaborate on your next release!`,
    },
    email: {
      subject: (name) => `Elevating ${name}'s thumbnail packaging & brand authority`,
      professional: (name) =>
`Hi ${name},

I've been following your channel and love your video style.

As a channel expands, the visual packaging directly communicates authority. Clean, beautifully color-graded thumbnails not only maximize your CTR in competitive niches, but also position your channel as an industry leader when pitching brand sponsors.

I specialize in premium, agency-level YouTube thumbnail design:
• Realistic facial lighting, 3D depth, and clean cutout edges
• Symmetrical, uncluttered composition that commands attention
• Consistent visual identity that makes your videos instantly recognizable in any feed

I would love to partner with you as your dedicated thumbnail designer to give your content the visual polish it deserves.

Would you be open to discussing how we can collaborate on your upcoming releases?

Best regards,
[Your Name]
[Your Portfolio Link]`,
      direct: (name) =>
`Hey ${name},

High-performing channels deserve high-performing packaging.

I help creators upgrade from basic graphics to agency-level, 3D-polished thumbnails that command attention from viewers and brand sponsors alike.

I'd love to discuss partnering on your upcoming releases.

Are you open to connecting this week?

Cheers,
[Your Name]`,
      portfolio: (name) =>
`Hi ${name},

Great work on your recent uploads!

I'm a designer focused on premium visual branding for YouTube creators. You can review my client portfolio and design aesthetic here:
👉 [Your Portfolio Link]

I'd love to bring this level of polish to ${name}'s upcoming video lineup.

Looking forward to connecting!

Warmly,
[Your Name]`
    }
  }
];

export function getTemplate(templateIndex = 0) {
  const safeIdx = ((templateIndex % OUTREACH_TEMPLATES.length) + OUTREACH_TEMPLATES.length) % OUTREACH_TEMPLATES.length;
  return OUTREACH_TEMPLATES[safeIdx];
}
