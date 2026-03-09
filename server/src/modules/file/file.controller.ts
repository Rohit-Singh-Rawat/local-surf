import type { Request, Response } from 'express';
import { success } from '../../lib/api-response';
import { getAuth } from '../../lib/auth-utils';
import type { FileRow } from './file.repository';
import type { FileService } from './file.service';

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

/** Extracts a validated route param as a plain string. Zod validate middleware guarantees this. */
const p = (req: Request, key: string): string => req.params[key] as string;

export class FileController {
  constructor(private service: FileService) {}

  initiateUpload = async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    const { file, uploadUrl } = await this.service.initiateUpload(userId, req.body);
    res.status(201).json(success({ file: toFileResponse(file), uploadUrl }));
  };

  confirmUpload = async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    const file = await this.service.confirmUpload(userId, p(req, 'id'));
    res.json(success(toFileResponse(file)));
  };

  getDownloadUrl = async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    const { file, downloadUrl } = await this.service.getDownloadUrl(userId, p(req, 'id'));
    res.json(success({ file: toFileResponse(file), downloadUrl }));
  };

  rename = async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    const file = await this.service.rename(userId, p(req, 'id'), req.body.name as string);
    res.json(success(toFileResponse(file)));
  };

  delete = async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    await this.service.softDelete(userId, p(req, 'id'));
    res.status(204).send();
  };

  restore = async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    const file = await this.service.restore(userId, p(req, 'id'));
    res.json(success(toFileResponse(file)));
  };

  search = async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    const files = await this.service.search(userId, req.query.q as string);
    res.json(success(files.map(toFileResponse)));
  };
}
