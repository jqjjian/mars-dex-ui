/** @type {import('next').NextConfig} */
const dotenv = require('dotenv')
dotenv.config()
const nextConfig = {
    images: {
        domains: ['utfs.io', 'localhost']
    },
    output: 'standalone'
}

module.exports = nextConfig
