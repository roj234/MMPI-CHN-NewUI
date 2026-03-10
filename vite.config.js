// vite.config.js
import unconscious from 'unconscious/VitePlugin.mjs';
import purgecss from 'unconscious/VitePurgeCSS.mjs';
import InlineVars from "unconscious/postcss/inline-vars.js";
import {viteSingleFile} from 'vite-plugin-singlefile';

//https://cn.vite.dev/
export default {
    plugins: [
        unconscious(),
        purgecss(),
        viteSingleFile()
    ],

    define: { },

    css: {
        postcss: {
            plugins: [
                InlineVars({})
            ]
        }
    },

    base: '', // 绝对路径什么的不要啊
    build: {
        modulePreload: { polyfill: false },
        assetsInlineLimit: 512,
        rollupOptions: {
            output: {
                entryFileNames: `[name].[hash].js`,
                chunkFileNames: `[name].[hash].js`,
                assetFileNames: `[name].[hash].[ext]`,
            },
        }
    }
};