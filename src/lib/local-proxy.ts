export const LOCAL_PROXY_BASE_URL = "";
export const COMPANION_UI_URL = "";
export const COMPANION_DOWNLOAD_URL = "";
export async function detectLocalProxy(_force=false):Promise<boolean>{return false;}
export function isLocalProxyActive(){return false;}
export async function resolveApiEndpoint(path:string){return "/api"+(path.startsWith("/")?path:"/"+path);}
export function buildStreamProxyUrl(options:{url:string;referer?:string;headers?:Record<string,string>;playlistKey?:string}){
  try{const u=new URL(options.url);if(u.protocol==="https:"||u.protocol==="blob:")return options.url;}catch{}return "";
}
