import { notFound } from "next/navigation";
import Board from "@/components/Board";
import { BackLink, Heading, Main, PageHeader, Subtitle } from "@/components/layout";
import ProjectSettings from "@/components/ProjectSettings";
import { Badge } from "@/components/ui/badge";
import { getProject, listTags, listTasks } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const projectId = Number(id);
    const project = Number.isInteger(projectId) ? await getProject(projectId) : undefined;
    if (!project) notFound();

    const [tasks, allTags] = await Promise.all([listTasks(project.id), listTags()]);

    return (
        <Main $width={1280}>
            <BackLink href="/">&larr; All projects</BackLink>
            <PageHeader>
                <div>
                    <Heading>
                        {project.title}
                        {project.done && <Badge variant="secondary">Done</Badge>}
                    </Heading>
                    {project.description && <Subtitle>{project.description}</Subtitle>}
                </div>
                <ProjectSettings project={project} allTags={allTags} />
            </PageHeader>
            <Board projectId={project.id} initialTasks={tasks} labels={project.labels} />
        </Main>
    );
}
