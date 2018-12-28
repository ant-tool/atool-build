import { join, resolve } from 'path';
import { writeFileSync } from 'fs';
import webpack, { ProgressPlugin } from 'webpack';
import chalk from 'chalk';
import notifier from 'node-notifier';
import notify from 'umi-notify';
import mergeCustomConfig from './mergeCustomConfig';
import getWebpackCommonConfig from './getWebpackCommonConfig';

function checkConfig(webpackConfig) {
  const config = Array.isArray(webpackConfig) ? webpackConfig : [webpackConfig];
  const hasEmptyEntry = config.some(c => Object.keys(c.entry || {}).length === 0);
  if (hasEmptyEntry) {
    const err = new Error('no webpack entry found');
    err.name = 'NoEntry';
    throw err;
  }
}

function getWebpackConfig(args, cache) {
  let webpackConfig = getWebpackCommonConfig(args);

  webpackConfig.plugins = webpackConfig.plugins || [];

  // Config outputPath.
  if (args.outputPath) {
    webpackConfig.output.path = args.outputPath;
  }

  if (args.publicPath) {
    webpackConfig.output.publicPath = args.publicPath;
  }

  // Config if no --no-compress.
  // Watch mode should not use UglifyJsPlugin
  if (args.compress && !args.watch) {
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
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
      }),
    ];
  } else {
    webpackConfig.plugins = [...webpackConfig.plugins,
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      }),
    ];
  }

  // Watch mode should not use DedupePlugin
  if (!args.watch) {
    webpackConfig.plugins = [...webpackConfig.plugins,
      new webpack.optimize.DedupePlugin(),
    ];
  }

  webpackConfig.plugins = [...webpackConfig.plugins,
    new webpack.NoErrorsPlugin(),
  ];

  // Output map.json if hash.
  if (args.hash) {
    const pkg = require(join(args.cwd, 'package.json'));
    webpackConfig.output.filename = '[name]-[chunkhash].js';
    webpackConfig.output.chunkFilename = '[name]-[chunkhash].js';
    webpackConfig.plugins = [...webpackConfig.plugins,
      require('map-json-webpack-plugin')({
        assetsPath: pkg.name,
        cache,
      }),
    ];
  }

  if (typeof args.config === 'function') {
    webpackConfig = args.config(webpackConfig) || webpackConfig;
  } else {
    webpackConfig = mergeCustomConfig(webpackConfig, resolve(args.cwd, args.config || 'webpack.config.js'));
  }
  checkConfig(webpackConfig);
  return webpackConfig;
}

export default function build(args, callback) {
  notify.onBuildStart({ name: 'atool-build', version: 1 });

  // Get config.
  let webpackConfig = getWebpackConfig(args, {});
  webpackConfig = Array.isArray(webpackConfig) ? webpackConfig : [webpackConfig];

  let fileOutputPath;
  webpackConfig.forEach((config) => {
    fileOutputPath = config.output.path;
  });


  webpackConfig.forEach((config) => {
    config.plugins.push(
      new ProgressPlugin((percentage, msg) => {
        const stream = process.stderr;
        if (stream.isTTY && percentage < 0.71) {
          stream.cursorTo(0);
          stream.write(`📦  ${chalk.magenta(msg)}`);
          stream.clearLine(1);
        } else if (percentage === 1) {
          console.log(chalk.green('\nwebpack: bundle build is now finished.'));
        }
      }),
    );
  });


  function doneHandler(err, stats) {
    notify.onBuildComplete({ name: 'atool-build', version: 1 }, { err });

    if (args.json) {
      const filename = typeof args.json === 'boolean' ? 'build-bundle.json' : args.json;
      const jsonPath = join(fileOutputPath, filename);
      writeFileSync(jsonPath, JSON.stringify(stats.toJson()), 'utf-8');
      console.log(`Generate Json File: ${jsonPath}`);
    }

    const { errors } = stats.toJson();
    if (errors && errors.length) {
      process.on('exit', () => {
        process.exit(1);
      });
    }
    // if watch enabled only stats.hasErrors would log info
    // otherwise  would always log info
    if (!args.watch || stats.hasErrors()) {
      const buildInfo = stats.toString({
        colors: true,
        children: true,
        chunks: !!args.verbose,
        modules: !!args.verbose,
        chunkModules: !!args.verbose,
        hash: !!args.verbose,
        version: !!args.verbose,
      });
      if (stats.hasErrors()) {
        console.error(buildInfo);
      } else {
        console.log(buildInfo);
        notifier.notify({
          title: 'ant tool',
          message: 'done',
          subtitle: 'build successfully',
          contentImage: join(__dirname, '../assets/success.png'),
          sound: 'Glass',
        });
      }
    }

    if (err) {
      process.on('exit', () => {
        process.exit(1);
      });
      console.error(err);
    }

    if (callback) {
      setTimeout(() => {
        callback(err);
      }, 1000);
    }
  }

  // Run compiler.
  const compiler = webpack(webpackConfig);

  // Hack: remove extract-text-webpack-plugin log
  if (!args.verbose) {
    compiler.plugin('done', (stats) => {
      stats.stats.forEach((stat) => {
        stat.compilation.children = stat.compilation.children.filter((child) => {// eslint-disable-line
          return child.name !== 'extract-text-webpack-plugin';
        });
      });
    });
  }

  if (args.watch) {
    compiler.watch(args.watch || 200, doneHandler);
  } else {
    compiler.run(doneHandler);
  }
}
