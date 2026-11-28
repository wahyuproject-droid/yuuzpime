import type { ReactNode } from "react";
import Container from "@/components/container";
export default function Layout({children}: {children: ReactNode}) {
  return <Container className="py-8">{children}</Container>;
}
