import type { Request, Response } from 'express';
import { success } from '../../lib/api-response';
import { getAuth } from '../../lib/auth-utils';
import type { TrashService } from './trash.service';

export class TrashController {
  constructor(private service: TrashService) {}

  permanentDeleteFile = async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    await this.service.permanentDeleteFile(userId, req.params.id as string);
    res.status(204).send();
  };

  permanentDeleteFolder = async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    const result = await this.service.permanentDeleteFolder(userId, req.params.id as string);
    res.json(
      success({
        filesDeleted: result.filesDeleted,
        foldersDeleted: result.foldersDeleted,
        storageFreed: result.storageFreed,
      }),
    );
  };

  emptyTrash = async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    const result = await this.service.emptyTrash(userId);
    res.json(
      success({
        filesDeleted: result.filesDeleted,
        foldersDeleted: result.foldersDeleted,
        storageFreed: result.storageFreed,
      }),
    );
  };
}
