import type { GoogleProfile } from '../../config/passport';
import { NotFoundError, ValidationError } from '../../lib/app-error';
import type { User, UserRepository } from './user.repository';

export class UserService {
  constructor(private repo: UserRepository) {}

  async findById(id: string): Promise<User> {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundError('User', id);
    return user;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.repo.findByEmail(email);
  }

  async upsertFromGoogle(profile: GoogleProfile): Promise<User> {
    const email = profile.emails?.[0]?.value;
    if (!email) throw new ValidationError('Google account must have a verified email address');

    return this.repo.upsertByGoogleId({
      googleId: profile.id,
      email,
      name: profile.displayName,
      avatar: profile.photos?.[0]?.value ?? null,
    });
  }
}
