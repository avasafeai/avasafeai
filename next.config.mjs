/** @type {import('next').NextConfig} */
const nextConfig = {
  // Treat GCP KMS / gRPC as server-external — prevents webpack from trying
  // to bundle Node.js built-ins (fs, tls, net) into the client bundle.
  serverExternalPackages: ['@google-cloud/kms', '@grpc/grpc-js', 'google-gax'],
};

export default nextConfig;
