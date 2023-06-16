
const fs = require('fs') // 文件操作工具
const script=require('child_process') // 命令行工具

const glob = require('glob')//glob 是一个用于匹配文件路径的库
const chalk = require('chalk')// 颜色显示工具
const file = require('../utils/file')// 颜色显示工具

/**
 * @desc: 安装相关依赖
 */
 function installModules() {
    const modules = [
        'eslint@6.7.2',
        'babel-eslint@10.1.0',
        'eslint-plugin-vue@6.2.2',
        'prettier@2.2.1',
        '@vue/eslint-config-prettier@6.0.0',
        'eslint-plugin-prettier@3.3.1'
    ]
    const commitModules = ['husky', 'lint-staged', '@commitlint/cli', '@commitlint/config-conventional']
    //如果已经存在package-lock.json,安装依赖可能会卡住
    fs.existsSync('package-lock.json') && fs.unlinkSync('package-lock.json')
    modules.push(...commitModules)
    const moduleCmd = modules.join(' ')
    execSync(`npm install ${moduleCmd} -D`)
}
 
 
/**
 * @desc: 简化execSync
 * @param {*} str
 */
function execSync(str,rootPath) {
    script.execSync(str, {
        cwd: rootPath||'./', //指定执行的目录
        stdio: 'inherit',//用于指定子进程的标准输入/输出流 inherit：继承父级输入输出
        shell: process.platform === 'win32'//用于指定要运行的 shell 程序,例如，在 Windows 中，会使用 cmd.exe
    })
}

/**
 * @desc: 查找eslint配置并删除
 */
function findEslintOptionFileToDel() {
    // **:匹配任何路径  ignore:忽略查找
    const files = glob.sync('**', {
        ignore: ['**/node_modules/**', '.husky/**', '.git/**', '**/src/**', '**/public/**'],
        dot: true
    })
    const nameList = ['eslintignore', 'eslintrc', 'prettierrc', 'prettierignore', 'lintstagedrc', 'commitlint']
    let reg = RegExp(`\\${nameList.join('|')}`)
    files.forEach((element) => {
        // unlinkSync:删除指定路径的文件
        reg.test(element) && fs.unlinkSync(element)
    })
}
/**
 * @desc: 查找web项目eslint依赖并卸载
 */
function findEslintOptionToDel() {
    const files = glob.sync('**/package.json', {
        ignore: ['**/node_modules/**', '.husky/**', '.git/**', '**/src/**', '**/public/**']
    })
    files.forEach((element) => {
        const dataStr = fs.readFileSync(element, 'utf-8')
        let json = JSON.parse(dataStr)
        //去除子项目eslint配置
        if (json.eslintConfig) {
            json.eslintConfig = undefined
        }
        let removeCmdStr = 'npm uninstall'
        if (json.devDependencies) {
            Object.keys(json.devDependencies).forEach((item) => {
                if (item.indexOf('stylelint') < 0 && (item.indexOf('eslint') >= 0 || item.indexOf('prettier') >= 0)) {
                    //删除package.json内的依赖
                    delete json.devDependencies[item]
                    removeCmdStr += ` ${item}`
                }
            })
            //判断是否已安装了依赖，是那就使用命令卸载相关依赖
            if (removeCmdStr !== 'npm uninstall' && fs.existsSync(element.replace('package.json', 'node_modules'))) {
                // 防止卸载依赖时卡住，先删除lock文件
                fs.existsSync(element.replace('package.json', 'package-lock.json')) &&
                    fs.unlinkSync(element.replace('package.json', 'package-lock.json'))
                execSync(removeCmdStr, element.replace('package.json', '') === '' ? './' : element.replace('package.json', ''))
            }
            //覆盖package.json文件
            fs.writeFileSync(element, JSON.stringify(json, '', '\t'))
        }
    })
}
/**
 * @desc: 启动husky
 */
 function initHusky() {
    execSync(`npx husky install`)
}
/**
* @desc: 添加git提交钩子
*/
function addHook() {
    if (!fs.existsSync('./.husky/commit-msg')) {
        execSync(`npx husky add .husky/commit-msg `)
    }
    if (fs.existsSync('./.husky/pre-commit')) {
        fs.unlinkSync('./.husky/pre-commit')
    }
    fs.readFile('./.husky/commit-msg', 'utf-8', function (err, dataStr) {
        //已存在则不再添加命令
        let newDataStr = dataStr.substring(0, dataStr.lastIndexOf('sh"') + 3) + '\n'
        newDataStr += '\nnpx --no-install commitlint --edit $1'
        newDataStr += '\nnpx --no-install lint-staged'
        fs.writeFileSync('./.husky/commit-msg', newDataStr)
    })
}

/**
 * @desc: 修改其他配置
 */
 function otherOperation() {
    //修改vue.config 内的编译自动eslint检测配置
    const files = glob.sync('**/vue.config.js', {
      ignore: ['**/node_modules/**', '.husky/**', '.git/**', '**/src/**', '**/public/**']
    })
    files.forEach((element) => {
      fs.readFile(element, 'utf-8', function (err, dataStr) {
        let newDataStr
        if (dataStr.indexOf('lintOnSave') >= 0) {
          newDataStr = dataStr.replace(/lintOnSave: true/g, 'lintOnSave: false')
        } else {
          newDataStr =
            dataStr.slice(0, dataStr.indexOf('{') + 1) +
            '\n  lintOnSave: false,' +
            dataStr.slice(dataStr.indexOf('{') + 1)
        }
        newDataStr && fs.writeFileSync(element, newDataStr)
      })
    })
  }
 
  const gitDownload=require('download-git-repo')//git下载工具
/**
 * @desc: 复制eslint配置文件到项目
 */
function copyEslintOptionFileToItem(completeFn) {
    const package = require('../package.json')
    //从git中获取文件
    const gitPath = 'http://192.168.2.221/team/web_team/web-specification.git#main'
    script.exec(`npm ls ${package.name} -g --parseable`, (err, stdout) => { //下载到全局安装的模块路径下
        if (!err) {
            const pluginsisChildPath = stdout.trim()
            const configurationPath = `${pluginsisChildPath}/configuration`
            const isExist = fs.existsSync(configurationPath)
            if (isExist) {
                file.delDir(configurationPath)
            }
            fs.mkdirSync(configurationPath)
            gitDownload(`direct:${gitPath}`, configurationPath, { clone: true }, (err) => {
                if (err) {
                    console.log('执行失败,请重试')
                    process.exit()
                }
                const filterNames = ['.md', '.prettierrc']
                const ruletfilePath = `${configurationPath}/configurationFiles/ruletVue2`
                file.copyFile(ruletfilePath, './', filterNames)
                const prettier =
                    fs.existsSync(`${ruletfilePath}/.prettierrc`) &&
                    JSON.parse(fs.readFileSync(`${ruletfilePath}/.prettierrc`, 'utf-8'))
                completeFn({ prettier })
            })
        }
    })
}
/**
 * @desc: 复制eslint配置文件到项目
 */
 function copyEslintOptionFileToItem(completeFn) {
    const package = require('../package.json')
    //从git中获取文件
    const gitPath = 'http://192.168.2.221/team/web_team/web-specification.git#main'
    script.exec(`npm ls ${package.name} -g --parseable`, (err, stdout) => { //下载到全局安装的模块路径下
        if (!err) {
            const pluginsisChildPath = stdout.trim()
            const configurationPath = `${pluginsisChildPath}/configuration`
            const isExist = fs.existsSync(configurationPath)
            if (isExist) {
                file.delDir(configurationPath)
            }
            fs.mkdirSync(configurationPath)
            gitDownload(`direct:${gitPath}`, configurationPath, { clone: true }, (err) => {
                if (err) {
                    console.log('执行失败,请重试')
                    process.exit()
                }
                const filterNames = ['.md', '.prettierrc']
                const ruletfilePath = `${configurationPath}/configurationFiles/ruletVue2`
                file.copyFile(ruletfilePath, './', filterNames)
                const prettier =
                    fs.existsSync(`${ruletfilePath}/.prettierrc`) &&
                    JSON.parse(fs.readFileSync(`${ruletfilePath}/.prettierrc`, 'utf-8'))
                completeFn({ prettier })
            })
        }
    })
}
/**
 * @desc: 增加package.json的eslint检测脚本命令
 */
 function addPackageScript(ruletInfo) {
    fs.readFile('./package.json', 'utf-8', function (err, dataStr) {
      let json = JSON.parse(dataStr)
      if(ruletInfo&&ruletInfo.prettier){
        json['prettier'] = ruletInfo.prettier
      }
      json['lint-staged'] = {
        '*.{js,ts,tsx,vue}': 'eslint'
      }
      fs.writeFileSync('./package.json', JSON.stringify(json, '', '\t'))
    })
}
/**
* @desc: 检查当前执行命令的路径
*/
function checkPath() {
    //使用.git 判断是因为husky初始化必须依赖.git文件夹
   const files = glob.sync('.git', { dot: true })//dot:true 匹配以 . 开头的文件或文件夹
   if (files.length === 0) {
       console.log(chalk.red('命令执行错误：请在项目根目录运行本命令'))
       process.exit()
   }
}
/**
 * @desc: 规范安装
 */
function init() {
    //1. 检测下执行的路径
    checkPath()
    //2. 检测下项目里面是否已经有eslint等配置
    findEslintOptionFileToDel()
    findEslintOptionToDel()
    //3. 安装所需要的依赖包
    installModules()
    //4. 启动husky
    initHusky()
    //5. 添加git提交钩子   
    addHook()  
    //6. 修改一些其他配置
    otherOperation()
    //7. 复制配置文件到项目目录  }
    copyEslintOptionFileToItem((ruletInfo) => {
        addPackageScript(ruletInfo)
        console.log(chalk.green('规范安装成功'))
    })
}
module.exports = {
    init
}