import React from 'react';
export default function Image({src,fill,unoptimized,priority,quality,sizes,alt,...props}:any){if(!src)return null;return <img {...props} src={typeof src==='string'?src:src.src} alt={alt||''} loading={priority?'eager':'lazy'} decoding="async" style={{...(props.style||{}),...(fill?{position:'absolute',inset:0,width:'100%',height:'100%'}:{})}}/>}
