import {useState,useEffect} from 'react';
function useHash(){const [hash,setHash]=useState(location.hash.slice(1)||'/');useEffect(()=>{const fn=()=>setHash(location.hash.slice(1)||'/');window.addEventListener('hashchange',fn);return()=>window.removeEventListener('hashchange',fn)},[]);return hash;}
export function useParams(){return {slug:useHash().split('/')[2]?.split('?')[0]||''};}
export function usePathname(){return useHash().split('?')[0];}
export function useSearchParams(){return new URLSearchParams(useHash().split('?')[1]||'');}
export function useRouter(){return {push:(p:string)=>{location.hash=p;},back:()=>history.back(),replace:(p:string)=>location.replace('#'+p)};}
