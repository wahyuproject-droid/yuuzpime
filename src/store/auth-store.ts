import { create } from "zustand";
export type IAuth = { id:string; avatar:string; email:string; username:string; collectionId:string; collectionName:string; autoSkip:boolean; created?:string; };
export interface IAuthStore {
  auth: IAuth | null;
  setAuth: (state: IAuth) => void;
  clearAuth: () => void;
  isRefreshing: boolean;
  setIsRefreshing: (val:boolean) => void;
}
export const useAuthStore = create<IAuthStore>((set)=>({
  auth:null,
  setAuth:()=>set({auth:null}),
  clearAuth:()=>set({auth:null}),
  isRefreshing:false,
  setIsRefreshing:()=>set({isRefreshing:false}),
}));
export const useAuthHydrated = () => true;
