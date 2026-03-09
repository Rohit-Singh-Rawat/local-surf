import type { Request, Response } from 'express';
import { success } from '../../lib/api-response';
import { getAuth } from '../../lib/auth-utils';
import type { UserService } from './user.service';

export class UserController {
  constructor(private userService: UserService) {}

  getMe = async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    const user = await this.userService.findById(userId);

    res.json(
      success({
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        storageUsed: user.storageUsed,
        storageQuota: user.storageQuota,
        createdAt: user.createdAt,
      }),
    );
  };
}
