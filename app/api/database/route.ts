import { timingSafeEqual } from "node:crypto";
import { exportDatabase, importDatabase, InvalidDatabaseImportError } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_UPLOAD_BYTES = 128 * 1024 * 1024;
const SQLITE_CONTENT_TYPES = new Set(["application/octet-stream", "application/vnd.sqlite3", "application/x-sqlite3"]);

class UploadTooLargeError extends Error { }

function authorizationError(request: Request): Response | null {
    const expectedToken = process.env.DATABASE_API_TOKEN;
    if (!expectedToken) {
        return Response.json({ error: "Database API is disabled; configure DATABASE_API_TOKEN." }, { status: 503 });
    }

    const match = /^Bearer\s+(.+)$/i.exec(request.headers.get("authorization") ?? "");
    if (!match) return Response.json({ error: "Unauthorized." }, { status: 401 });

    const expected = Buffer.from(expectedToken);
    const provided = Buffer.from(match[1]);
    if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
        return Response.json({ error: "Unauthorized." }, { status: 401 });
    }
    return null;
}

async function readUpload(request: Request): Promise<Buffer> {
    if (!request.body) return Buffer.alloc(0);

    const reader = request.body.getReader();
    const chunks: Buffer[] = [];
    let totalBytes = 0;
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            totalBytes += value.byteLength;
            if (totalBytes > MAX_UPLOAD_BYTES) {
                await reader.cancel().catch(() => undefined);
                throw new UploadTooLargeError();
            }
            chunks.push(Buffer.from(value));
        }
    } finally {
        reader.releaseLock();
    }
    return Buffer.concat(chunks, totalBytes);
}

export async function GET(request: Request): Promise<Response> {
    const authError = authorizationError(request);
    if (authError) return authError;

    try {
        const backup = await exportDatabase();
        const date = new Date().toISOString().slice(0, 10);
        return new Response(new Uint8Array(backup), {
            headers: {
                "Cache-Control": "no-store",
                "Content-Disposition": `attachment; filename="kanban-${date}.sqlite"`,
                "Content-Length": String(backup.byteLength),
                "Content-Type": "application/vnd.sqlite3",
            },
        });
    } catch (error) {
        console.error("Failed to export SQLite database.", error);
        return Response.json({ error: "Database export failed." }, { status: 500 });
    }
}

export async function POST(request: Request): Promise<Response> {
    const authError = authorizationError(request);
    if (authError) return authError;

    const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
    if (!contentType || !SQLITE_CONTENT_TYPES.has(contentType)) {
        return Response.json({ error: "Send a SQLite file as the raw request body." }, { status: 415 });
    }

    const contentLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_UPLOAD_BYTES) {
        return Response.json({ error: "Upload exceeds the 128 MiB limit." }, { status: 413 });
    }

    try {
        const upload = await readUpload(request);
        if (upload.length === 0) return Response.json({ error: "The upload is empty." }, { status: 400 });
        await importDatabase(upload);
        return Response.json({ message: "Database imported successfully." });
    } catch (error) {
        if (error instanceof UploadTooLargeError) {
            return Response.json({ error: "Upload exceeds the 128 MiB limit." }, { status: 413 });
        }
        if (error instanceof InvalidDatabaseImportError) {
            return Response.json({ error: error.message }, { status: 400 });
        }
        console.error("Failed to import SQLite database.", error);
        return Response.json({ error: "Database import failed." }, { status: 500 });
    }
}
