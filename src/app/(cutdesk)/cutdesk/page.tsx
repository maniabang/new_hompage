import { actor } from "@/lib/cutdesk/auth";
import { Workbench } from "@/components/cutdesk/Workbench";
import { siteMode } from "@/lib/site-mode";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function Home() {
  if (siteMode() !== "cutdesk") notFound();
  return <Workbench name={await actor()} />;
}
