import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

// Корень для Turbopack — КОРЕНЬ МОНОРЕПО, а не apps/cms.
// pnpm кладёт реальные пакеты в <репо>/node_modules/.pnpm, а в apps/cms/node_modules
// оставляет симлинки. Turbopack разрешает симлинки в реальные пути и отказывается
// собирать то, что лежит выше своего корня — отсюда «couldn't find next/package.json».
// Считаем от рабочей директории процесса (и dev, и build стартуют из apps/cms), а не
// от import.meta.url: TS-конфиг компилируется во временный файл, dirname врёт.
import path from 'path'

const projectRoot = path.resolve(process.cwd(), '../..')

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
