import './globals.css';

export const metadata = {
  title: 'Eddie Vetter — Trademark Intelligence',
  description: 'AI-powered trademark name vetting tool',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
