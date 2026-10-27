import { actor } from "@/lib/cutdesk/auth";
import { Workbench } from "@/components/cutdesk/Workbench";
export const dynamic = "force-dynamic";
export default async function Home() {
  return <Workbench name={await actor()} />;
}
