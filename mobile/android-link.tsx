import React from 'react';
export default function Link({href,children,...props}:any){const url=typeof href==='string'?href:'/';return <a {...props} href={url.startsWith('/')?'#'+url:url}>{children}</a>}
