import NewProjectForm from "@/components/NewProjectForm";
import ProjectList from "@/components/ProjectList";
import { Heading, Main, PageHeader } from "@/components/layout";
import { listProjects, listTags } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
    const [projects, allTags] = await Promise.all([listProjects(), listTags()]);

    return (
        <Main $width={1024}>
            <PageHeader style={{ alignItems: "center" }}>
                <Heading>Projects</Heading>
                <NewProjectForm allTags={allTags} />
            </PageHeader>
            <ProjectList projects={projects} allTags={allTags} />
        </Main>
    );
}
