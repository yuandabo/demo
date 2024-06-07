const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true'
})
const path = require('path')
// function resolve(dir) {
//     return path.join(__dirname, dir)
// }
/** @type {import('next').NextConfig} */
module.exports = withBundleAnalyzer({
    productionBrowserSourceMaps: false,
    env: {
        NEXT_PUBLIC_ENV: 'PRODUCTION', //your next configs goes here
    },
    webpack:(config) => {
        config.resolve.alias['@'] = path.resolve(__dirname)
        return config
    }
})

