import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { STORE_NAME, STORE_DESCRIPTION } from "@/utils/storeConfig";
import { getSeoSettings } from "@/lib/seo";
import { ToastProvider } from "@/components/Toast";
import ErrorBoundary from "@/components/ErrorBoundary";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoSettings();

  return {
    title: seo.default_title || `${STORE_NAME} — Marketplace Produk Rumah Tangga`,
    description: seo.default_description || STORE_DESCRIPTION,
    keywords: seo.default_keywords || undefined,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const seo = await getSeoSettings();

  return (
    <html lang="id">
      <body className="font-sans antialiased">
        <ToastProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </ToastProvider>

        {/* Meta Pixel */}
        {seo.meta_pixel_id && (
          <>
            <Script id="meta-pixel" strategy="afterInteractive">
              {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${seo.meta_pixel_id}');
                fbq('track', 'PageView');
              `}
            </Script>
            <noscript>
              {/* eslint-disable-next-line @next/next/no-img-element -- tracking pixel di dalam noscript; next/image tidak bisa dipakai tanpa JS */}
              <img
                height="1" width="1" style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${seo.meta_pixel_id}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}

        {/* Google Analytics GA4 */}
        {seo.ga4_measurement_id && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${seo.ga4_measurement_id}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-config" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${seo.ga4_measurement_id}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
