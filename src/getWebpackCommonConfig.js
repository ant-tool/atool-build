import webpack from 'webpack';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import getBabelCommonConfig from './getBabelCommonConfig';
import { join } from 'path';
import rucksack from 'rucksack-css';
import autoprefixer from 'autoprefixer';

export default function getWebpackCommonConfig(args) {
  const pkg = require(join(args.cwd, 'package.json'));

  const jsFileName = args.hash ? '[name]-[chunkhash].js' : '[name].js';
  const cssFileName = args.hash ? '[name]-[chunkhash].css' : '[name].css';
  const commonName = args.hash ? 'common-[chunkhash].js' : 'common.js';

  const babelQuery = getBabelCommonConfig();

  const emptyBuildins = [
    'child_process',
    'cluster',
    'dgram',
    'dns',
    'fs',
    'module',
    'net',
    'readline',
    'repl',
    'tls',
  ];

  const browser = pkg.browser || {};

  const node = emptyBuildins.reduce((obj, name) => {
    if (!(name in browser)) {
      return { ...obj, ...{ [name]: 'empty' } };
    }
    return obj;
  }, {});


  return {

    babel: babelQuery,

    output: {
      path: join(process.cwd(), './dist/'),
      filename: jsFileName,
      chunkFilename: jsFileName,
    },

    devtool: args.devtool,

    resolve: {
      modulesDirectories: ['node_modules', join(__dirname, '../node_modules')],
      extensions: ['', '.js', '.jsx'],
    },

    resolveLoader: {
      modulesDirectories: ['node_modules', join(__dirname, '../node_modules')],
    },

    entry: pkg.entry,

    node,

    module: {
      loaders: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          loader: 'babel',
          query: babelQuery,
        },
        {
          test: /\.jsx$/,
          loader: 'babel',
          query: babelQuery,
        },
        {
          test(filePath) {
            return /\.css$/.test(filePath) && !/\.module\.css$/.test(filePath);
          },
          loader: ExtractTextPlugin.extract(
            'css?sourceMap&-restructuring!' +
            'postcss-loader'
          ),
        },
        {
          test: /\.module\.css$/,
          loader: ExtractTextPlugin.extract(
            'css?sourceMap&-restructuring&modules&localIdentName=[local]___[hash:base64:5]!' +
            'postcss-loader'
          ),
        },
        {
          test(filePath) {
            return /\.less$/.test(filePath) && !/\.module\.less$/.test(filePath);
          },
          loader: ExtractTextPlugin.extract(
            'css?sourceMap!' +
            'postcss-loader!' +
            `less-loader?{"sourceMap":true,"modifyVars":${JSON.stringify(pkg.theme || {})}}`
          ),
        },
        {
          test: /\.module\.less$/,
          loader: ExtractTextPlugin.extract(
            'css?sourceMap&modules&localIdentName=[local]___[hash:base64:5]!!' +
            'postcss-loader!' +
            `less-loader?{"sourceMap":true,"modifyVars":${JSON.stringify(pkg.theme || {})}}`
          ),
        },
        { test: /\.woff(\?v=\d+\.\d+\.\d+)?$/, loader: 'url?limit=10000&minetype=application/font-woff' },
        { test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/, loader: 'url?limit=10000&minetype=application/font-woff' },
        { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: 'url?limit=10000&minetype=application/octet-stream' },
        { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: 'file' },
        { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: 'url?limit=10000&minetype=image/svg+xml' },
        { test: /\.(png|jpg|jpeg|gif)(\?v=\d+\.\d+\.\d+)?$/i, loader: 'url?limit=10000' },
        { test: /\.json$/, loader: 'json' },
        { test: /\.html?$/, loader: 'file?name=[name].[ext]' },
      ],
    },

    postcss: [
      rucksack(),
      autoprefixer({
        browsers: ['last 2 versions', 'Firefox ESR', '> 1%', 'ie >= 8'],
      }),
    ],

    plugins: [
      new webpack.optimize.CommonsChunkPlugin('common', commonName),
      new ExtractTextPlugin(cssFileName, {
        disable: false,
        allChunks: true,
      }),
      new webpack.optimize.OccurenceOrderPlugin(),
    ],
  };
}
