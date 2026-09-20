// The static StudyHub site now lives in public/. This rewrite serves
// public/index.html at the root URL "/" so the main site keeps its
// original address (no /index.html suffix, no redirects).
//
// /spark-ai points to the /tutor AI route for dedicated SEO entry point.
async function rewrites() {
  return [
    { source: "/", destination: "/index.html" },
    { source: "/spark-ai", destination: "/tutor" },
  ];
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  rewrites,
};

export default nextConfig;
