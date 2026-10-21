import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  webpack(config, { isServer, webpack }) {
    if (!isServer) {
      // PptxGenJS has guarded Node-only file/network branches. Normalize the
      // node: protocol so its published browser:false mappings apply.
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^node:(fs|https)$/,
          (resource: { request: string }) => {
            resource.request = resource.request.slice(5);
          },
        ),
      );
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        https: false,
      };
    }
    return config;
  },
};

export default nextConfig;
