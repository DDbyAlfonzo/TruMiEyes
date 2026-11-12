import type { AppProps } from "next/app";
import Head from "next/head";
import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { registerServiceWorker } from "../lib/pwa";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <SessionProvider session={(pageProps as any).session}>
      <Head>
        <title>TruMiEyes | Studio Proofing</title>
        <meta
          name="description"
          content="Private photography galleries, image proofing, favourites, comments, and client delivery by TruMiEyes."
        />
        <meta name="application-name" content="TruMiEyes" />
        <meta name="theme-color" content="#231F20" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TruMiEyes" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="TruMiEyes" />
        <meta property="og:title" content="TruMiEyes Studio Proofing" />
        <meta
          property="og:description"
          content="A private luxury photography proofing portal for client galleries and selections."
        />
        <meta property="og:image" content="/social-card.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="TruMiEyes Studio Proofing" />
        <meta
          name="twitter:description"
          content="Private photography galleries, proofing, selections, and delivery."
        />
        <meta name="twitter:image" content="/social-card.jpg" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon-32.png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>
      <Component {...pageProps} />
      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: "#231F20",
            border: "1px solid #393536",
            color: "#fff",
          },
        }}
      />
    </SessionProvider>
  );
}
