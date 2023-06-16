#!/usr/bin/env node
const program = require('commander') //引入依赖包
 
program
    .version(`test-cli ${require('../package').version}`) //配置显示版本号
    .usage('<command> [options]') //设置帮助信息中显示命令的使用方式
 
program
    .command('standard <type>')//自定义命令及传参
    .alias('st')// 命令的别名,简化命令记忆
    .option('--ts', '使用typescript')
    .description('规范插件')//命令的说明
    .action((type, options, command) => {//执行函数；type 为设置的传参，options 为设置的选项，cmd为命令对象
        // console.log(type, options, command);
        require('../plugins/InjectionRuletVue2').init()
    })
 
program.parse(process.argv)