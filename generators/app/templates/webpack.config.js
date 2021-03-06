'use strict';
const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const AssetsPlugin = require('assets-webpack-plugin');
const precss = require('precss');
const cssnano = require('cssnano');
const postcssImport = require('postcss-import');
const pxtorem = require('postcss-pxtorem');
const sprites = require('postcss-sprites');
const copy = require('postcss-copy');
const imagemin = require('imagemin');
const _ = require('lodash');
const hbs = require('handlebars');

const distDir = './<%= distDir %>'; // 生成的文件存放地址，每次 build 之前先会删除，再 build
const isProduction = process.env.npm_lifecycle_event === 'build';
const useHash = <% if (!useHash) { %>false<% } else { %>isProduction<% } %>;
const spriteHash = _.random(11111111, 99999999); // 每次 build ，雪碧图使用随机数做 hash

const spritesConfig = {
    basePath: `${distDir}/build`,
    stylesheetPath: `${distDir}/build`,
    spritePath: `${distDir}/sprites`,
    spritesmith: {
        padding: 4
    },
    filterBy(fileMeta) {
        return /src\/sprites/.test(fileMeta.path) ? Promise.resolve() : Promise.reject(); // 只生成 sprites 目录的雪碧图
    },
    groupBy(fileMeta) {
        const filePath = fileMeta.path.replace(__dirname, '');
        const group = path.dirname(filePath).split('/').pop(1); // 根据目录分组，防止合并后的图片太大

        fileMeta.retina = true; // 强制所有图片都是用二倍图
        fileMeta.ratio = 2;
        return group ? Promise.resolve(group) : Promise.reject();
    },
    hooks: {
        onSaveSpritesheet(opts, groups) {
            let output;

            groups = groups || [];
            output = isProduction ? [groups, spriteHash, 'png'] : [groups, 'png'];
            return path.join(opts.spritePath, output.join('.'));
        }
    }
};
const copyConfig = {
    src: './src',
    dest: distDir,
    template(fileMeta) {
        let template = path.join(fileMeta.path, `${fileMeta.name}.${fileMeta.ext}`);

        if (isProduction) {
            template = path.join(fileMeta.path, `${fileMeta.name}.${fileMeta.hash.slice(0, 8)}.${fileMeta.ext}`);
        }
        return template;
    },
    relativePath() {
        return `${distDir}/build`; // CSS文件存放地址
    },
    inputPath(decl) {
        if (!decl.source) {
            return path.resolve('src/css'); // postcss-sprites 添加的雪碧图没有源文件，伪造一个
        }
        return path.dirname(decl.source.input.file);
    },
    transform: function fileProcess(fileMeta) {
        if (['jpg', 'png', 'gif'].indexOf(fileMeta.ext) !== -1) {
            return imagemin([fileMeta.absolutePath], {
                plugins: [

                    // imageminMozjpeg({targa: true}),
                    // imageminPngquant({quality: '65-80'})
                ]
            }).then(files => {
                fileMeta.contents = files[0].data;
                return fileMeta;
            });
        } else {
            return Promise.resolve(fileMeta);
        }
    },
    ignore(fileMeta) {
        return /src\/sprites/.test(fileMeta.absolutePath) || /src\/svg/.test(fileMeta.absolutePath); // 忽略雪碧图
    }
};

function postcssPlugin(toWebpack) {
    return [
        postcssImport({
            addDependencyTo: toWebpack
        }),
        precss,
        sprites.default(spritesConfig),
        copy(copyConfig),
        pxtorem({
            rootValue: 100,
            unitPrecision: 5, // 保留5位小数字
            minPixelValue: 2, // 小于 2 时，不转换
            selectorBlackList: [], // 选择器黑名单，可以使用正则
            propWhiteList: [] // 属性名称为空，表示替换所有属性的值
        }),
        cssnano({
            discardComments: {
                removeAll: true
            },
            autoprefixer: {
                add: true,
                browsers: ['> 1%']
            }
        })
    ];
}

module.exports = {
    entry: {
        index: ['./src/js/index.js', './src/css/style.css']
    },
    output: {
        path: `${distDir}/build`,
        publicPath: '/build',
        filename: useHash ? '[name].[hash:8].js' : '[name].js'
    },
    module: {
        loaders: [{
            test: /\.css$/,
            loader: ExtractTextPlugin.extract('style', 'css?sourceMap&-url!postcss?syntax=postcss-scss')
        }, {
            test: /\.js$/i,
            exclude: /node_modules/,
            loader: 'babel' // babel
        }]
    },
    plugins: [
        <% if (jQuery) { %>new webpack.ProvidePlugin({
            $: 'jquery'
        }),
        <% } %>new webpack.optimize.CommonsChunkPlugin({
            name: 'libs',
            minChunks: 2 // 如果包被require两次以上，自动合并到 libs 目录
        }),
        new ExtractTextPlugin(useHash ? '[name].[hash:8].css' : '[name].css')
    ],
    devServer: {
        host: '0.0.0.0',
        port: +'<%= port %>',
        inline: true,
        contentBase: distDir,
        headers: {
            'Access-Control-Allow-Origin': '*'
        }
    },
    babel: {
        <% if (es6) { %>presets: ['es2015'],
        <% } %>plugins: ['transform-runtime']
    },
    postcss: postcssPlugin
};

if (isProduction) {
    module.exports.plugins.push(
        new CleanWebpackPlugin([distDir], {
            verbose: true
        }),
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: 'production'
            }
        }),
        new webpack.optimize.UglifyJsPlugin({
            comments: false,
            compress: {
                warnings: false
            }
        }),
        new webpack.BannerPlugin('<%= banner %>', {
            entryOnly: true
        }),
        new webpack.optimize.OccurenceOrderPlugin()
    );
} else {
    module.exports.devtool = '#source-map';
}

if (useHash) {
    module.exports.plugins.push(
        new AssetsPlugin({
            fullPath: false,
            prettyPrint: true
        })
    );
}