import type { InferSelectModel } from 'drizzle-orm';
import type { Request, Response } from 'express';
import type { files, folders } from '../../db/schema';
import { success } from '../../lib/api-response';
import { getAuth } from '../../lib/auth-utils';
import type { FolderService } from './folder.service';

type Folder = InferSelectModel<typeof folders>;
type FileRow = InferSelectModel<typeof files>;

function toFolderResponse(f: Folder) {
  return {
    id: f.id,
    name: f.name,
    parentId: f.parentId,
    createdAt: f.createdAt,
    updatedAt: f.updatedAt,
  };
}

function toFileResponse(f: FileRow) {
  return {
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    size: f.size,
    folderId: f.folderId,
    createdAt: f.createdAt,
    updatedAt: f.updatedAt,
  };
}

export class FolderController {
  constructor(private service: FolderService) {}

  create = async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    const folder = await this.service.create(userId, req.body);
    res.status(201).json(success(toFolderResponse(folder)));
  };

  getRootContents = async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    await this.respondWithContents(userId, null, res);
  };

  getContents = async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    await this.respondWithContents(userId, req.params.id, res);
  };

  rename = async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    const folder = await this.service.rename(userId, req.params.id, req.body.name);
    res.json(success(toFolderResponse(folder)));
  };

  delete = async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    await this.service.softDelete(userId, req.params.id);
    res.status(204).send();
  };

  restore = async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    await this.service.restore(userId, req.params.id);
    res.json(success({ restored: true }));
  };

  getBreadcrumb = async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    const breadcrumb = await this.service.getBreadcrumb(userId, req.params.id);
    res.json(success(breadcrumb));
  };

  getTrash = async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    const { folders, files } = await this.service.getTrash(userId);
    res.json(
      success({
        folders: folders.map((f) => ({ ...toFolderResponse(f), trashedAt: f.trashedAt })),
        files: files.map((f) => ({ ...toFileResponse(f), trashedAt: f.trashedAt })),
      }),
    );
  };

  private respondWithContents = async (userId: string, folderId: string | null, res: Response) => {
    const { folder, folders, files } = await this.service.getContents(userId, folderId);
    res.json(
      success({
        folder: folder ? toFolderResponse(folder) : null,
        folders: folders.map(toFolderResponse),
        files: files.map(toFileResponse),
      }),
    );
  };
}
