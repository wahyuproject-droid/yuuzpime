import {defineConfig} from 'vite';
import path from 'node:path';
export default defineConfig({base:'/',resolve:{alias:{'@':path.resolve(__dirname,'src'),'next/link':path.resolve(__dirname,'src/android-link.tsx'),'next/image':path.resolve(__dirname,'src/android-image.tsx')}},build:{target:'es2020',sourcemap:false,outDir:'dist'}});
