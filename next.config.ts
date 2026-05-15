import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
    experimental: {
        serverActions: {
            /** 管理端预设含长 prompt / 多图 URL 时，默认 1MB 会导致 fetch 直接失败 */
            bodySizeLimit: "8mb",
            /** 本地用非 3000 端口（如 3001）时，放宽 Server Action 来源校验 */
            allowedOrigins: [
                "localhost:3000",
                "localhost:3001",
                "127.0.0.1:3000",
                "127.0.0.1:3001",
            ],
        },
    },
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "moohnyrevdbteuszlpyi.supabase.co"
            }
            ,
            {
                protocol: "https",
                hostname: "qwkccrpysbnsdqfweqki.supabase.co"
            },
            {
                protocol: "https",
                hostname: "vqubaohredxnfsbgstur.supabase.co"
            },
            {
                protocol: "https",
                hostname: "saqmdjmtmzcenikjcofh.supabase.co"
            },
            {
                protocol: "https",
                hostname: "images.unsplash.com"
            },
            {
                protocol: "https",
                hostname: "cdn.jsdelivr.net"
            },
            {
                protocol: "https",
                hostname: "upload.apimart.ai"
            }
        ]
    },
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                path: false,
                util: false
            };
        }
        return config;
    },
};

export default withNextIntl(nextConfig);
