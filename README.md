# atool-build

[![Greenkeeper badge](https://badges.greenkeeper.io/ant-tool/atool-build.svg)](https://greenkeeper.io/)

[![NPM version](https://img.shields.io/npm/v/atool-build.svg?style=flat)](https://npmjs.org/package/atool-build)
[![Build Status](https://img.shields.io/travis/ant-tool/atool-build.svg?style=flat)](https://travis-ci.org/ant-tool/atool-build)
[![Coverage Status](https://img.shields.io/coveralls/ant-tool/atool-build.svg?style=flat)](https://coveralls.io/r/ant-tool/atool-build)
[![NPM downloads](http://img.shields.io/npm/dm/atool-build.svg?style=flat)](https://npmjs.org/package/atool-build)
[![Dependency Status](https://david-dm.org/ant-tool/atool-build.svg)](https://david-dm.org/ant-tool/atool-build)

基于 webpack 的构建封装.

----

## 特性

- 基于 webpack 实现
- 支持通过 `webpack.config.js` 进行扩展 webpack 的配置项
- 支持 [stage-0](https://babeljs.io/docs/plugins/preset-stage-0), [es2015](https://babeljs.io/docs/plugins/preset-es2015), react 和 less
- 支持 hash 模式的构建, 并生成映射表 `map.json`  
- 支持 typescript

## 安装

```bash
$ npm i atool-build --save
```

## 使用

```bash
$ atool-build [options]
```

### 命令行参数

```bash
$ atool-build -h
  
  Usage: atool-build [options]
  
  Options:
  
    -h, --help                output usage information
    -v, --version             output the version number
    -o, --output-path <path>  output path
    -w, --watch [delay]       watch file changes and rebuild
    --hash                    build with hash and output map.json
    --publicPath <publicPath> webpack publicPath
    --devtool <devtool>       sourcemap generate method, default is null
    --config <path>           custom config path, default is webpack.config.js
    --no-compress             build without compress 
```

### 配置扩展

如果需要对内置的 webpack 配置进行修改, 可在项目根目录新建 `webpack.config.js` 进行扩展.


让 `webpack.config.js` 输出 `Function`, 比如:

```javascript
var path = require("path");
module.exports = function(webpackConfig) {
  webpackConfig.output.path = path.join(__dirname, './public');
  return webpackConfig;
};
```

参数:

- `webpackConfig` -- 默认配置, 修改后返回新的配置


详细内容：[atool-build 基本使用](http://ant-tool.github.io/atool-build.html)


## FAQ

> 如何在 webpack.config.js 中引用 webpack ? (新增插件需要) 

`var webpack = require('atool-build/lib/webpack');`

[#32](https://github.com/ant-tool/atool-build/issues/32)
