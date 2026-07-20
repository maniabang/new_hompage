import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Interview } from "@/components/Interview";
import { Skills } from "@/components/Skills";
import { Experience } from "@/components/Experience";
import { SideProjects } from "@/components/SideProjects";
import { Contact } from "@/components/Contact";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <Interview />
        <Skills />
        <Experience />
        <SideProjects />
        <Contact />
      </main>
    </>
  );
}
