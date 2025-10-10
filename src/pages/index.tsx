// import { Geist, Geist_Mono } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';

// const geistSans = Geist({
//   variable: '--font-geist-sans',
//   subsets: ['latin'],
// });

// const geistMono = Geist_Mono({
//   variable: '--font-geist-mono',
//   subsets: ['latin'],
// });

export default function Home() {
  return (
    <main style={{ padding: '2rem' }}>
      <h1>Welcome</h1>
      <p>
        <Link href='/snip'>Go to /snip</Link>
      </p>
    </main>
  );
}
