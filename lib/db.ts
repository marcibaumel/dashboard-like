import "server-only";
import Database from "better-sqlite3";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { DataSource, EntitySchema, In, QueryFailedError } from "typeorm";
import type { Label, LabelColor, Project, ProjectWithCounts, Status, Task } from "./types";
import { DEFAULT_LABELS, isProjectKey, MAX_PROJECT_KEY_LENGTH, STATUSES } from "./types";

interface TagRow {
    id: number;
    name: string;
}

interface LabelRow {
    id: number;
    projectId: number;
    name: string;
    color: string;
    project?: ProjectRow;
}

interface ProjectRow {
    id: number;
    key: string;
    nextTaskNumber: number;
    title: string;
    description: string;
    done: boolean;
    labelsSeeded: boolean;
    createdAt: Date;
    tags?: TagRow[];
    labels?: LabelRow[];
    tasks?: TaskRow[];
}

interface TaskRow {
    id: number;
    number: number;
    title: string;
    description: string;
    status: Status;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
    labels?: LabelRow[];
    project?: ProjectRow;
    projectId: number;
}

const TagEntity = new EntitySchema<TagRow>({
    name: "Tag",
    tableName: "tags",
    columns: {
        id: { type: Number, primary: true, generated: "increment" },
        name: { type: String, unique: true },
    },
});

const LabelEntity = new EntitySchema<LabelRow>({
    name: "Label",
    tableName: "labels",
    columns: {
        id: { type: Number, primary: true, generated: "increment" },
        projectId: { type: Number },
        name: { type: String },
        color: { type: String, default: "gray" },
    },
    relations: {
        project: {
            type: "many-to-one",
            target: "Project",
            joinColumn: { name: "projectId" },
            onDelete: "CASCADE",
        },
    },
});

const ProjectEntity = new EntitySchema<ProjectRow>({
    name: "Project",
    tableName: "projects",
    columns: {
        id: { type: Number, primary: true, generated: "increment" },
        key: { type: String, unique: true },
        nextTaskNumber: { type: Number, default: 1 },
        title: { type: String },
        description: { type: String, default: "" },
        done: { type: Boolean, default: false },
        labelsSeeded: { type: Boolean, default: false },
        createdAt: { type: "datetime", createDate: true },
    },
    relations: {
        tasks: { type: "one-to-many", target: "Task", inverseSide: "project" },
        labels: { type: "one-to-many", target: "Label", inverseSide: "project" },
        tags: {
            type: "many-to-many",
            target: "Tag",
            joinTable: { name: "project_tags" },
        },
    },
});

const TaskEntity = new EntitySchema<TaskRow>({
    name: "Task",
    tableName: "tasks",
    uniques: [{ columns: ["projectId", "number"] }],
    columns: {
        id: { type: Number, primary: true, generated: "increment" },
        number: { type: Number },
        projectId: { type: Number },
        title: { type: String },
        description: { type: String, default: "" },
        status: { type: "varchar", length: 20, default: "TODO" },
        sortOrder: { type: Number, default: 0 },
        createdAt: { type: "datetime", createDate: true },
        updatedAt: { type: "datetime", updateDate: true },
    },
    relations: {
        project: {
            type: "many-to-one",
            target: "Project",
            inverseSide: "tasks",
            joinColumn: { name: "projectId" },
            onDelete: "CASCADE",
        },
        labels: {
            type: "many-to-many",
            target: "Label",
            joinTable: { name: "task_labels" },
        },
    },
});

const g = globalThis as unknown as { kanbanDs?: Promise<DataSource> };
const DATABASE_FILE = process.env.KANBAN_DATABASE_FILE || path.join(process.cwd(), "kanban.db");
const IMPORT_TABLES = {
    tags: ["id", "name"],
    projects: ["id", "title", "description", "done", "createdAt", "labelsSeeded", "key", "nextTaskNumber"],
    labels: ["id", "projectId", "name", "color"],
    tasks: ["id", "projectId", "title", "description", "status", "createdAt", "updatedAt", "sortOrder", "number"],
    project_tags: ["projectsId", "tagsId"],
    task_labels: ["tasksId", "labelsId"],
} as const;

export class InvalidDatabaseImportError extends Error {
    constructor() {
        super("The uploaded file is not a compatible Kanban SQLite database.");
        this.name = "InvalidDatabaseImportError";
    }
}

function migrateTaskNumbers(db: Database.Database): void {
    const tableExists = (name: string) =>
        Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(name));
    if (!tableExists("projects") || !tableExists("tasks")) return;

    db.transaction(() => {
        const projectColumns = new Set(
            (db.pragma('table_info("projects")') as { name: string }[]).map((column) => column.name),
        );
        const taskColumns = new Set(
            (db.pragma('table_info("tasks")') as { name: string }[]).map((column) => column.name),
        );
        const legacy =
            !projectColumns.has("key") && !projectColumns.has("nextTaskNumber") && !taskColumns.has("number");
        if (!legacy) {
            if (!projectColumns.has("key") || !projectColumns.has("nextTaskNumber") || !taskColumns.has("number")) {
                throw new Error("Database has an incomplete project numbering schema.");
            }
            return;
        }

        db.exec(
            "ALTER TABLE projects ADD COLUMN \"key\" varchar NOT NULL DEFAULT '';" +
                'ALTER TABLE projects ADD COLUMN "nextTaskNumber" integer NOT NULL DEFAULT 1;' +
                'ALTER TABLE tasks ADD COLUMN "number" integer NOT NULL DEFAULT 0;',
        );
        const projects = db.prepare("SELECT id, title FROM projects ORDER BY id").all() as {
            id: number;
            title: string;
        }[];
        const used = new Set<string>();
        const updateProject = db.prepare('UPDATE projects SET "key" = ?, "nextTaskNumber" = ? WHERE id = ?');
        const updateTask = db.prepare('UPDATE tasks SET "number" = ? WHERE id = ?');
        const projectTasks = db.prepare("SELECT id FROM tasks WHERE projectId = ? ORDER BY createdAt, id");
        for (const project of projects) {
            const base =
                project.title
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "")
                    .replace(/^[^A-Z]+/, "")
                    .slice(0, 3) || "PRJ";
            let key = base;
            let suffix = 2;
            while (used.has(key)) {
                const suffixText = String(suffix++);
                key = base.slice(0, MAX_PROJECT_KEY_LENGTH - suffixText.length) + suffixText;
            }
            used.add(key);
            const rows = projectTasks.all(project.id) as { id: number }[];
            rows.forEach((task, index) => updateTask.run(index + 1, task.id));
            updateProject.run(key, rows.length + 1, project.id);
        }
    }).immediate();
}

function getDataSource(): Promise<DataSource> {
    // Cached on globalThis so dev hot reloads reuse one connection.
    return (g.kanbanDs ??= new DataSource({
        type: "better-sqlite3",
        database: DATABASE_FILE,
        entities: [TagEntity, LabelEntity, ProjectEntity, TaskEntity],
        synchronize: true,
        prepareDatabase: (db) => {
            db.pragma("journal_mode = WAL");
            migrateTaskNumbers(db);
        },
    }).initialize());
}

function nativeConnection(dataSource: DataSource): Database.Database {
    return (dataSource.driver as unknown as { databaseConnection: Database.Database }).databaseConnection;
}

function validateDatabaseFile(filePath: string): void {
    let imported: Database.Database | undefined;
    try {
        imported = new Database(filePath, { fileMustExist: true });
        if (imported.pragma("quick_check", { simple: true }) !== "ok") {
            throw new InvalidDatabaseImportError();
        }

        const tables = new Set(
            (imported.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as { name: string }[]).map(
                (table) => table.name,
            ),
        );
        for (const [table, requiredColumns] of Object.entries(IMPORT_TABLES)) {
            if (!tables.has(table)) throw new InvalidDatabaseImportError();
            const columns = new Set(
                (imported.pragma(`table_info("${table}")`) as { name: string }[]).map((column) => column.name),
            );
            const addedColumns = table === "projects" ? ["key", "nextTaskNumber"] : table === "tasks" ? ["number"] : [];
            if (!requiredColumns.every((column) => columns.has(column) || addedColumns.includes(column))) {
                throw new InvalidDatabaseImportError();
            }
        }

        if ((imported.pragma("foreign_key_check") as unknown[]).length > 0) {
            throw new InvalidDatabaseImportError();
        }
        migrateTaskNumbers(imported);
        const invalidProject = imported.prepare('SELECT "key", "nextTaskNumber" FROM projects').all() as {
            key: unknown;
            nextTaskNumber: unknown;
        }[];
        const keys = new Set<string>();
        for (const project of invalidProject) {
            if (
                typeof project.key !== "string" ||
                !isProjectKey(project.key) ||
                keys.has(project.key) ||
                !Number.isSafeInteger(project.nextTaskNumber) ||
                Number(project.nextTaskNumber) < 1
            ) {
                throw new InvalidDatabaseImportError();
            }
            keys.add(project.key);
        }
        const invalidTask = imported
            .prepare(
                'SELECT 1 FROM tasks t JOIN projects p ON p.id = t.projectId WHERE typeof(t."number") != \'integer\' OR t."number" < 1 OR t."number" >= p."nextTaskNumber" UNION ALL SELECT 1 FROM tasks GROUP BY projectId, "number" HAVING COUNT(*) > 1 LIMIT 1',
            )
            .get();
        if (invalidTask) throw new InvalidDatabaseImportError();
    } catch (error) {
        if (error instanceof InvalidDatabaseImportError) throw error;
        throw new InvalidDatabaseImportError();
    } finally {
        imported?.close();
    }
}

export async function exportDatabase(): Promise<Buffer> {
    const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "kanban-export-"));
    const backupFile = path.join(temporaryDirectory, "kanban.sqlite");
    try {
        await nativeConnection(await getDataSource()).backup(backupFile);
        return await readFile(backupFile);
    } finally {
        await rm(temporaryDirectory, { recursive: true, force: true });
    }
}

export async function importDatabase(data: Uint8Array): Promise<void> {
    const file = Buffer.from(data);
    const signature = Buffer.from("SQLite format 3\u0000");
    if (file.length < signature.length || !file.subarray(0, signature.length).equals(signature)) {
        throw new InvalidDatabaseImportError();
    }

    const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "kanban-import-"));
    const importFile = path.join(temporaryDirectory, "kanban.sqlite");
    try {
        await writeFile(importFile, file, { flag: "wx" });
        validateDatabaseFile(importFile);

        const connection = nativeConnection(await getDataSource());
        connection.prepare("ATTACH DATABASE ? AS incoming").run(importFile);
        try {
            const transaction = connection.transaction(() => {
                connection.pragma("defer_foreign_keys = ON");
                connection.exec(
                    "DELETE FROM task_labels; DELETE FROM project_tags; DELETE FROM tasks; DELETE FROM labels; DELETE FROM projects; DELETE FROM tags;",
                );
                const copies = Object.entries(IMPORT_TABLES).map(([table, columns]) => {
                    const columnList = columns.join(", ");
                    return `INSERT INTO main."${table}" (${columnList}) SELECT ${columnList} FROM incoming."${table}";`;
                });
                connection.exec(copies.join("\n"));
                if ((connection.pragma("foreign_key_check") as unknown[]).length > 0) {
                    throw new Error("Imported database violates foreign key constraints.");
                }
            });
            transaction.immediate();
        } finally {
            connection.exec("DETACH DATABASE incoming");
        }
    } finally {
        await rm(temporaryDirectory, { recursive: true, force: true });
    }
}

const tagNames = (tags?: TagRow[]) => (tags ?? []).map((t) => t.name).sort();

const toLabel = (l: LabelRow): Label => ({ id: l.id, name: l.name, color: l.color as LabelColor });

const toProject = (p: ProjectRow): Project => ({
    id: p.id,
    key: p.key,
    title: p.title,
    description: p.description,
    done: Boolean(p.done),
    tags: tagNames(p.tags),
    labels: [...(p.labels ?? [])].sort((a, b) => a.id - b.id).map(toLabel),
    createdAt: new Date(p.createdAt).toISOString(),
});

const toTask = (t: TaskRow): Task => ({
    id: t.id,
    projectId: t.projectId,
    number: t.number,
    title: t.title,
    description: t.description,
    status: t.status,
    sortOrder: t.sortOrder,
    labelIds: (t.labels ?? []).map((l) => l.id),
    createdAt: new Date(t.createdAt).toISOString(),
    updatedAt: new Date(t.updatedAt).toISOString(),
});

async function projects() {
    return (await getDataSource()).getRepository(ProjectEntity);
}

async function tasks() {
    return (await getDataSource()).getRepository(TaskEntity);
}

async function tagRepo() {
    return (await getDataSource()).getRepository(TagEntity);
}

async function labelRepo() {
    return (await getDataSource()).getRepository(LabelEntity);
}

/** Gives every project that hasn't been seeded yet the default label set (once). */
async function seedLabels(): Promise<void> {
    const repo = await projects();
    const pending = await repo.find({ where: { labelsSeeded: false }, select: { id: true } });
    if (pending.length === 0) return;
    const labels = await labelRepo();
    await labels.save(pending.flatMap((p) => DEFAULT_LABELS.map((l) => labels.create({ projectId: p.id, ...l }))));
    await repo.update({ id: In(pending.map((p) => p.id)) }, { labelsSeeded: true });
}

/** Resolves names to stored tags, creating any that don't exist yet. */
async function findOrCreateTags(names: string[]): Promise<TagRow[]> {
    if (names.length === 0) return [];
    const repo = await tagRepo();
    const existing = await repo.findBy({ name: In(names) });
    const known = new Set(existing.map((t) => t.name));
    const created = await repo.save(names.filter((n) => !known.has(n)).map((name) => repo.create({ name })));
    return [...existing, ...created];
}

export async function listTags(): Promise<string[]> {
    const rows = await (await tagRepo()).find({ order: { name: "ASC" } });
    return rows.map((t) => t.name);
}

export async function listProjects(): Promise<ProjectWithCounts[]> {
    await seedLabels();
    const [all, rows] = await Promise.all([
        projects().then((r) =>
            r.find({
                relations: { tags: true, labels: true },
                order: { createdAt: "DESC", id: "DESC" },
            }),
        ),
        tasks().then((r) =>
            r
                .createQueryBuilder("t")
                .select("t.projectId", "projectId")
                .addSelect("t.status", "status")
                .addSelect("COUNT(*)", "n")
                .groupBy("t.projectId")
                .addGroupBy("t.status")
                .getRawMany<{ projectId: number; status: Status; n: number }>(),
        ),
    ]);

    return all.map((p) => {
        const counts = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<Status, number>;
        for (const r of rows) if (r.projectId === p.id) counts[r.status] = Number(r.n);
        return { ...toProject(p), counts };
    });
}

export async function getProject(id: number): Promise<Project | undefined> {
    await seedLabels();
    const p = await (
        await projects()
    ).findOne({
        where: { id },
        relations: { tags: true, labels: true },
    });
    return p ? toProject(p) : undefined;
}

export async function createProject(
    title: string,
    key: string,
    description: string,
    tags: string[],
): Promise<Project | null> {
    const repo = await projects();
    if (await repo.existsBy({ key })) return null;
    try {
        const saved = await repo.save(repo.create({ title, key, description, tags: await findOrCreateTags(tags) }));
        return toProject(saved);
    } catch (error) {
        if (
            error instanceof QueryFailedError &&
            error.driverError instanceof Error &&
            error.driverError.message === "UNIQUE constraint failed: projects.key"
        )
            return null;
        throw error;
    }
}

export async function updateProject(
    id: number,
    fields: { title?: string; description?: string; done?: boolean; tags?: string[] },
): Promise<Project | undefined> {
    const repo = await projects();
    const project = await repo.findOne({ where: { id }, relations: { tags: true } });
    if (!project) return undefined;
    const { tags, ...columns } = fields;
    await repo.save({ id, ...columns, tags: tags === undefined ? undefined : await findOrCreateTags(tags) });
    return toProject(await repo.findOneOrFail({ where: { id }, relations: { tags: true } }));
}

export async function deleteProject(id: number): Promise<void> {
    await (await projects()).delete({ id });
}

async function nameTaken(projectId: number, name: string, exceptId?: number): Promise<boolean> {
    const rows = await (await labelRepo()).findBy({ projectId });
    return rows.some((l) => l.id !== exceptId && l.name.toLowerCase() === name.toLowerCase());
}

/** Returns undefined when the name is already used by another label in the project. */
export async function createLabel(projectId: number, name: string, color: LabelColor): Promise<Label | undefined> {
    if (await nameTaken(projectId, name)) return undefined;
    const repo = await labelRepo();
    return toLabel(await repo.save(repo.create({ projectId, name, color })));
}

export async function updateLabel(
    id: number,
    fields: { name?: string; color?: LabelColor },
): Promise<Label | undefined> {
    const repo = await labelRepo();
    const label = await repo.findOneBy({ id });
    if (!label) return undefined;
    if (fields.name !== undefined) {
        if (await nameTaken(label.projectId, fields.name, id)) return undefined;
        label.name = fields.name;
    }
    if (fields.color !== undefined) label.color = fields.color;
    return toLabel(await repo.save(label));
}

export async function deleteLabel(id: number): Promise<void> {
    await (await labelRepo()).delete({ id });
}

export async function listTasks(projectId: number): Promise<Task[]> {
    const rows = await (
        await tasks()
    ).find({
        where: { projectId },
        relations: { labels: true },
        order: { status: "ASC", sortOrder: "ASC", createdAt: "ASC", id: "ASC" },
    });
    return rows.map(toTask);
}

export async function createTask(projectId: number, title: string, description: string, status: Status): Promise<Task> {
    const dataSource = await getDataSource();
    const connection = nativeConnection(dataSource);
    const create = connection.transaction(() => {
        const project = connection
            .prepare(
                'UPDATE projects SET "nextTaskNumber" = "nextTaskNumber" + 1 WHERE id = ? RETURNING "nextTaskNumber" - 1 AS number',
            )
            .get(projectId) as { number: number } | undefined;
        if (!project) throw new Error("Project not found.");
        const result = connection
            .prepare(
                'INSERT INTO tasks (projectId, "number", title, description, status, sortOrder, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, (SELECT COALESCE(MAX(sortOrder), -1) + 1 FROM tasks WHERE projectId = ? AND status = ?), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
            )
            .run(projectId, project.number, title, description, status, projectId, status);
        return Number(result.lastInsertRowid);
    });
    const id = create.immediate();
    return toTask(await dataSource.getRepository(TaskEntity).findOneByOrFail({ id }));
}

export async function reorderTasks(projectId: number, status: Status, taskIds: number[]): Promise<boolean> {
    const repo = await tasks();
    const projectTasks = await repo.find({ where: { projectId } });
    const existingIds = new Set(projectTasks.map((task) => task.id));
    const currentColumnIds = projectTasks.filter((task) => task.status === status).map((task) => task.id);

    if (taskIds.some((id) => !existingIds.has(id)) || currentColumnIds.some((id) => !taskIds.includes(id))) {
        return false;
    }

    await repo.manager.transaction(async (manager) => {
        const transactionRepo = manager.getRepository(TaskEntity);
        for (const [sortOrder, id] of taskIds.entries()) {
            await transactionRepo.update({ id, projectId }, { status, sortOrder });
        }
    });
    return true;
}

export async function updateTask(
    id: number,
    fields: { title?: string; description?: string; status?: Status; labelIds?: number[] },
): Promise<Task | undefined> {
    const repo = await tasks();
    const task = await repo.findOne({ where: { id }, relations: { labels: true } });
    if (!task) return undefined;
    const { labelIds, ...columns } = fields;
    if (fields.status !== undefined && fields.status !== task.status) {
        const lastTask = await repo.findOne({
            where: { projectId: task.projectId, status: fields.status },
            order: { sortOrder: "DESC" },
        });
        task.sortOrder = (lastTask?.sortOrder ?? -1) + 1;
    }
    Object.assign(task, columns);
    if (labelIds !== undefined) {
        // Restricting to the task's own project keeps labels from leaking across projects.
        task.labels = labelIds.length
            ? await (await labelRepo()).findBy({ id: In(labelIds), projectId: task.projectId })
            : [];
    }
    return toTask(await repo.save(task));
}

export async function deleteTask(id: number): Promise<void> {
    await (await tasks()).delete({ id });
}
