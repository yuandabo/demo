import { uglify } from "rollup-plugin-uglify"; // 压缩包
import babel from "rollup-plugin-babel"; // rollup 的 babel 插件，ES6转ES5
import replace from "rollup-plugin-replace"; // 替换待打包文件里的一些变量，如process在浏览器端是不存在的，需要被替换
import commonjs from 'rollup-plugin-commonjs' // 将非ES6语法的包转为ES6可用
import typescript from "@rollup/plugin-typescript";
import terser from '@rollup/plugin-terser';
import serve from "rollup-plugin-serve";
import livereload from "rollup-plugin-livereload";
// import alias from "@rollup/plugin-alias";

// const path = require('path')
// const resolveDir = dir => path.join(__dirname, dir)

const env = process.env.NODE_ENV;
const config = {
  input: "src/main.js",
  output: {
    file: "dist/bundle.cjs.js",
    format: "cjs",
    // bundleName: "bundleName",
  },
//   sourcemap: true,
  plugins: [
    typescript(),
    babel({
      exclude: "**/node_modules/**",
    }),
    // alias({
    //   entries: [
    //     { find: '@', replacement: resolveDir('src')}
    //   ]
    // }),
    replace({
      "process.env.NODE_ENV": JSON.stringify(env),
    }),
    commonjs(),
    terser(),
    livereload(),
    serve({
      open: true,
      port: 8888,
      contentBase: ''
    })
  ],
};
// if (env === "production") {
  config.plugins.push(
    uglify({
        compress: {
          dead_code: true,
          drop_console: true,
        },
        mangle: {
          toplevel: true,
        },
      })
  );
// }


export default config