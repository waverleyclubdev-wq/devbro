import type { NextConfig } from "next";
import path from "path";
const CopyPlugin = require("copy-webpack-plugin");

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // 1. Enable Async WebAssembly
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // 2. Output rule for Wasm (helps with cache busting)
    config.output.webassemblyModuleFilename = 'static/wasm/[modulehash].wasm';

    // 3. FORCE COPY: Move the Wasm binary from your Rust folder to the Public folder
    // This runs only on the client build (!isServer)
    if (!isServer) {
      config.plugins.push(
        new CopyPlugin({
          patterns: [
            {
              // SOURCE: Where your compiled Rust lives right now
              from: path.join(__dirname, "crates/particle_sim/pkg/particle_sim_bg.wasm"),
              
              // DESTINATION: Where Vercel/Next.js will serve it from
              to: path.join(__dirname, "public/static/wasm/particle_sim_bg.wasm"),
              
              noErrorOnMissing: true,
            },
          ],
        })
      );
    }

    return config;
  },
};

export default nextConfig;