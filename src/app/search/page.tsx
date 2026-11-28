import Container from "@/components/container";
import { Suspense } from "react";
import SearchResults from "./search-results";
export default function Page(){return <Container><Suspense fallback={<p className="py-8 text-center">Loading...</p>}><SearchResults/></Suspense></Container>;}
