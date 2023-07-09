import {
  webpackRscLayerName,
  createWebpackRscServerLoader,
  createWebpackRscSsrLoader,
  createWebpackRscClientLoader,
  WebpackRscServerPlugin,
  WebpackRscClientPlugin
} from '@mfng/webpack-rsc'
import TerserPlugin from 'terser-webpack-plugin'

const clientReferencesMap = new Map()
const serverReferencesMap = new Map()
const rscServerLoader = createWebpackRscServerLoader({clientReferencesMap})
const rscSsrLoader = createWebpackRscSsrLoader()
const rscClientLoader = createWebpackRscClientLoader({serverReferencesMap})

const serverConfig = {
  name: 'server',
  entry: './server/ssr.js',
  target: 'node',
  output: {
    filename: 'server.cjs',
  },
  module: {
    rules: [
      {
        resource: value => /create-rsc-\w+-stream\.jsx?$/.test(value),
        layer: webpackRscLayerName
      },
      {
        issuerLayer: webpackRscLayerName,
        resolve: { conditionNames: ['react-server', '...'] }
      },
      {
        oneOf: [
          {
            issuerLayer: webpackRscLayerName,
            test: /\.jsx?$/,
            use: [rscServerLoader, 'swc-loader']
          },
          {
            test: /\.jsx?$/,
            use: [rscSsrLoader, 'swc-loader']
          }
        ]
      }
    ]
  },
  plugins: [
    new WebpackRscServerPlugin({
      clientReferencesMap,
      serverReferencesMap,
    }),
  ],
  experiments: {
    layers: true,
  }
}

const clientConfig = {
  name: 'client',
  dependencies: ['server'],
  target: 'web',
  entry: './client.js',
  output: {
    filename: 'client.js'
  },
  module: {
    rules: [
      {
        test: /.jsx?$/,
        use: [rscClientLoader, 'swc-loader']
      }
    ]
  },
  plugins: [
    new WebpackRscClientPlugin({clientReferencesMap})
  ],
  optimization: {
    minimizer: [new TerserPlugin({
      terserOptions: {
        output: {
          // An internal React regex is being wrongly minified by terser
          ascii_only: true
        }
      }
    })]
  }
}

export default [serverConfig, clientConfig]
