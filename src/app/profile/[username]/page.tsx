import { redirect } from "next/navigation";
export type TargetProfileUser = { id:string; username:string; avatar:string; collectionId:string; collectionName:string; created:string; };
export default function ProfilePage(){redirect("/");}
