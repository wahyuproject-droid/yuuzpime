import { redirect } from '@remix-run/node';
export const loader = () => redirect('/');
export const action = () => redirect('/');
export default function GuestRedirect() { return null; }
