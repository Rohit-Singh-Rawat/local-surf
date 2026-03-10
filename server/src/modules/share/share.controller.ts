import type { InferSelectModel } from 'drizzle-orm';
import type { Request, Response } from 'express';
import type { files, users } from '../../db/schema';
import { success } from '../../lib/api-response';
import { getAuth } from '../../lib/auth-utils';
import type { Share } from './share.repository';
import type { ShareService } from './share.service';

type FileRow = InferSelectModel<typeof files>;
type User = InferSelectModel<typeof users>;

function toFileDto(f: FileRow) {
  return { id: f.id, name: f.name, mimeType: f.mimeType, size: f.size };
}

function toUserDto(u: User) {
  return { id: u.id, name: u.name, email: u.email, avatar: u.avatar };
}

function toShareDto(s: Share) {
  return {
    id: s.id,
    isPublic: s.isPublic,
    publicToken: s.isPublic ? s.publicToken : undefined,
    permission: s.permission,
    expiresAt: s.expiresAt,
    createdAt: s.createdAt,
  };
}

export class ShareController {
  constructor(private service: ShareService) {}

  shareWithUser = async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    const share = await this.service.shareWithUser(userId, req.body);
    res.status(201).json(success(toShareDto(share)));
  };

  createPublicLink = async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    const share = await this.service.createPublicLink(userId, req.body);
    res.status(201).json(success(toShareDto(share)));
  };

  getSharedWithMe = async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    const items = await this.service.getSharedWithMe(userId);
    res.json(
      success(
        items.map((i) => ({
          share: toShareDto(i.share),
          file: toFileDto(i.file),
          owner: toUserDto(i.owner),
        })),
      ),
    );
  };

  getMyShares = async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    const items = await this.service.getMyShares(userId);
    res.json(
      success(
        items.map((i) => ({
          share: toShareDto(i.share),
          file: toFileDto(i.file),
          sharedWith: i.sharedWith ? toUserDto(i.sharedWith) : null,
        })),
      ),
    );
  };

  accessPublicLink = async (req: Request, res: Response) => {
    const { share, file, viewUrl, downloadUrl } = await this.service.accessPublicLink(req.params.token as string);
    res.json(
      success({
        file: { name: file.name, mimeType: file.mimeType, size: file.size },
        permission: share.permission,
        viewUrl,
        downloadUrl,
      }),
    );
  };

  accessSharedFile = async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    const { share, file, viewUrl, downloadUrl } = await this.service.accessSharedFile(userId, req.params.id as string);
    res.json(
      success({
        file: { name: file.name, mimeType: file.mimeType, size: file.size },
        permission: share.permission,
        viewUrl,
        downloadUrl,
      }),
    );
  };

  revokeShare = async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    await this.service.revokeShare(userId, req.params.id as string);
    res.status(204).send();
  };

  updateShare = async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    const share = await this.service.updateShare(userId, req.params.id as string, req.body);
    res.json(success(toShareDto(share!)));
  };
}
