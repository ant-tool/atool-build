import { join } from 'path';
import rimraf from 'rimraf';
import webpack, { ProgressPlugin } from 'webpack';
import chalk from 'chalk';
import mergeCustomConfig from './mergeCustomConfig';
import getWebpackCommonConfig from './getWebpackCommonConfig';

export function getWebpackConfig(args) {
  let webpackConfig = getWebpackCommonConfig(args);

  webpackConfig.plugins = webpackConfig.plugins || [];

  // Config outputPath.
  if (args.outputPath) {
    webpackConfig.output.path = args.outputPath;
  }

  // Config if no --no-compress.
  if (args.compress) {
    webpackConfig.UglifyJsPluginConfig = {
      output: {
        ascii_only: true,
      },
      compress: {
        warnings: false,
      },
    };
    webpackConfig.plugins = [...webpackConfig.plugins,
      new webpack.optimize.UglifyJsPlugin(webpackConfig.UglifyJsPluginConfig),
    ];
  }

  webpackConfig.plugins = [...webpackConfig.plugins,
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    }),
    new webpack.optimize.DedupePlugin(),
    new webpack.NoErrorsPlugin(),
  ];

  // use current directory if cwd is not set
  if (!args.cwd) {
    args.cwd = process.cwd();
  }

  // Output map.json if hash.
  if (args.hash) {
    const pkg = require(join(args.cwd, 'package.json'));
    webpackConfig.output.filename = webpackConfig.output.chunkFilename = '[name]-[chunkhash].js';
    webpackConfig.plugins = [...webpackConfig.plugins,
      require('map-json-webpack-plugin')({
        assetsPath: pkg.name,
      }),
    ];
  }

  webpackConfig = mergeCustomConfig(webpackConfig, join(args.cwd, args.config || 'webpack.config.js'));

  return webpackConfig;
}

export default function(args, callback) {
  // Get config.
  let webpackConfig = getWebpackConfig(args);
  webpackConfig = Array.isArray(webpackConfig) ? webpackConfig : [webpackConfig];

  // Clean output dir first.
  webpackConfig.forEach(config => {
    rimraf.sync(config.output.path);
  });

  if (args.watch) {
    webpackConfig.forEach(config => {
      config.plugins.push(
        new ProgressPlugin((percentage, msg) => {
          const stream = process.stderr;
          if (stream.isTTY && percentage < 0.71) {
            stream.cursorTo(0);
            stream.write('📦  ' + chalk.magenta(msg));
            stream.clearLine(1);
          } else if (percentage === 1) {
            console.log(chalk.green('\nwebpack: bundle build is now finished.'));
          }
        })
      );
    });
  }

  function doneHandler(err, stats) {
    const { errors } = stats.toJson();
    if (errors && errors.length) {
      process.on('exit', function exitHandler() {
        process.exit(1);
      });
    }

    if (!args.watch || stats.hasErrors()) {
      console.log(stats.toString({colors: true}));
    }

    if (err) {
      process.on('exit', function exitHandler() {
        process.exit(1);
      });
      console.error(err);
    }

    if (callback) {
      callback(err);
    }
  }

  // Run compiler.
  const compiler = webpack(webpackConfig);
  if (args.watch) {
    compiler.watch(args.watch || 200, doneHandler);
  } else {
    compiler.run(doneHandler);
  }
}
