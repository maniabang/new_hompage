import { Header } from "@/components/Header";
import { MobileTabBar } from "@/components/MobileTabBar";
import { Hero } from "@/components/Hero";
import { Experience } from "@/components/Experience";
import { Skills } from "@/components/Skills";
import { Interview } from "@/components/Interview";
import { SideProjects } from "@/components/SideProjects";
import { Contact } from "@/components/Contact";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <Hero />
        <Experience />
        <Skills />
        <Interview />
        <SideProjects />
        <Contact />
      </main>
      <MobileTabBar />
    </>
  );
}
