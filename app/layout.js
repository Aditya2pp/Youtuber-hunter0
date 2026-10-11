import './globals.css';

export const metadata = {
  title: 'Find Client Who Need Work — YouTubers Finder Tool',
  description: 'Find Client Who Need Work - YouTubers Finder Tool for Video Editors, Thumbnail Designers, Agencies, and Brand Deals.',
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
