'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');

module.exports = yeoman.Base.extend({
    prompting: function() {
        var done = this.async();
        var prompts;

        this.log(yosay(
            '欢迎使用 ' + chalk.red('generator-mt')
        ));
        prompts = [{
            type: 'input',
            name: 'name',
            message: '项目名称:',
            default: 'static'
        }, {
            type: 'input',
            name: 'description',
            message: '项目介绍:',
            default: '前端代码目录'
        }, {
            type: 'input',
            name: 'port',
            message: '静态资源服务器端口地址:',
            default: 2222
        }, {
            type: 'input',
            name: 'rem',
            message: '1rem 等于多刷 px ?',
            default: 40
        }, {
            type: 'input',
            name: 'width',
            message: '设计图宽度:',
            default: 640
        }, {
            type: 'checkbox',
            name: 'pkg',
            message: '项目依赖:',
            choices: [{
                name: 'jquery',
                checked: true
            }, {
                name: 'fastclick'
            }, {
                name: 'swiper'
            }, {
                name: 'hammerjs'
            }]
        }, {
            type: 'confirm',
            name: 'jQuery',
            message: '全局使用 jQuery ?',
            default: true
        }, {
            type: 'confirm',
            name: 'es6',
            message: '使用 ES6 ?',
            default: true
        }, {
            type: 'input',
            name: 'banner',
            message: 'Banner 文字:',
            default: 'Happy Coding!'
        }];
        this.prompt(prompts, function(props) {
            this.props = props;
            done();
        }.bind(this));
    },
    gitInit: function() {
        this.spawnCommandSync('git', ['init']);
    },
    writing: function() {
        var self = this;

        ['src', '.eslintrc', '.stylelintrc'].forEach(function(file) {
            self.fs.copy(
                self.templatePath(file),
                self.destinationPath(file)
            );
        });
        ['README.md', 'package.json', 'webpack.config.js', 'rem.js'].forEach(function(file) {
            self.fs.copyTpl(
                self.templatePath(file),
                self.destinationPath(file),
                self.props
            );
        });
    },
    install: function() {

        // this.npmInstall(['-d']);
        this.npmInstall(this.props.pkg, {
            d: true,
            saveDev: true
        });
    },
    end: function() {
        this.log(yosay(
            chalk.green('Happy Coding')
        ));
    }
});
