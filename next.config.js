const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

// const withPWA = require('next-pwa')({
//   dest: 'public',
//   disable: process.env.NODE_ENV === 'development',
// })

const nextConfig = {
  // uncomment the following snippet if using styled components
  // compiler: {
  //   styledComponents: true,
  // },
  experimental: {},
  images: {},
  reactStrictMode: true, // Recommended for the `pages` directory, default in `app`.
  webpack(config, { isServer }) {
    // audio support
    config.module.rules.push({
      test: /\.(ogg|mp3|wav|mpe?g)$/i,
      exclude: config.exclude,
      use: [
        {
          loader: require.resolve('url-loader'),
          options: {
            limit: config.inlineImageLimit,
            fallback: require.resolve('file-loader'),
            publicPath: `${config.assetPrefix}/_next/static/images/`,
            outputPath: `${isServer ? '../' : ''}static/images/`,
            name: '[name]-[hash].[ext]',
            esModule: config.esModule || false,
          },
        },
      ],
    })

    // shader support
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      exclude: /node_modules/,
      use: ['raw-loader', 'glslify-loader'],
    })

    config.snapshot = {
      ...(config.snapshot ?? {}),
      // Add all node_modules but @next module to managedPaths
      // Allows for hot refresh of changes to @react-three module
      // much discussed feature:
      // - https://github.com/vercel/next.js/discussions/34380
      // - https://github.com/vercel/next.js/discussions/33929
      // - https://stackoverflow.com/questions/72290798/webpack-exclude-single-folder-of-node-modules-from-caching
      // - https://github.com/webpack/webpack/issues/11952
      // - https://github.com/webpack/webpack/issues/12112
      // - https://github.com/webpack/webpack/pull/14509
      // see this comment: https://stackoverflow.com/questions/71345874/should-changes-in-node-modules-invalidate-the-webpack-build-cache#comment131306189_72576675
      managedPaths: [/^node_modules\/(?!@react-three).*/],
    }

    return config
  },
}

// manage i18n
if (process.env.EXPORT !== 'true') {
  nextConfig.i18n = {
    locales: ['en', 'jp'],
    defaultLocale: 'en',
  }
}

const KEYS_TO_OMIT = ['webpackDevMiddleware', 'configOrigin', 'target', 'analyticsId', 'webpack5', 'amp', 'assetPrefix']

module.exports = (_phase, { defaultConfig }) => {
  const plugins = [/* [withPWA], */ [withBundleAnalyzer, {}]]

  const wConfig = plugins.reduce((acc, [plugin, config]) => plugin({ ...acc, ...config }), {
    ...defaultConfig,
    ...nextConfig,
  })

  const finalConfig = {}
  Object.keys(wConfig).forEach((key) => {
    if (!KEYS_TO_OMIT.includes(key)) {
      finalConfig[key] = wConfig[key]
    }
  })

  return finalConfig
}
