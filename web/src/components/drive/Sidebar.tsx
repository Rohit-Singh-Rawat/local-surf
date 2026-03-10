import { useQuery } from '@tanstack/react-query';
import { Link, useRouterState } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { FolderOpen, HardDrive, Trash2, Users } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { driveKeys, driveFetchers } from '@/lib/drive-queries';
import { formatBytes } from '@/lib/format';
import { authStore } from '@/store/auth';
import { NewButton } from '@/components/drive/NewButton';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
	{ label: 'My Drive', to: '/drive', icon: FolderOpen, exact: true },
	{ label: 'Shared with me', to: '/drive/shared', icon: Users, exact: false },
	{ label: 'Trash', to: '/drive/trash', icon: Trash2, exact: false },
] as const;

export function Sidebar() {
	const user = useStore(authStore, (s) => s.user);
	const pathname = useRouterState({ select: (s) => s.location.pathname });

	const { data: me } = useQuery({
		queryKey: driveKeys.me(),
		queryFn: driveFetchers.me,
		enabled: !!user,
	});

	const storage = me ?? user ?? null;
	const usedPct = storage
		? Math.min(100, Math.round((storage.storageUsed / storage.storageQuota) * 100))
		: 0;

	return (
		<aside className='flex h-full w-64 shrink-0 flex-col overflow-x-hidden bg-sidebar text-sidebar-foreground'>
			{/* Logo */}
			<div className='px-6 py-5'>
				<Logo
					iconHeight={32}
					iconWidth={27}
					textClassName='text-lg'
				/>
			</div>

			{/* New button */}
			<div className='px-4 pb-4'>
				<NewButton />
			</div>

			{/* Nav */}
			<nav className='flex-1 space-y-1 px-4'>
				{NAV_ITEMS.map(({ label, to, icon: Icon, exact }) => {
					const isActive = exact ? pathname === to : pathname.startsWith(to);

					return (
						<Link
							key={to}
							to={to}
							className={cn(
								'flex items-center gap-4 rounded-full px-4 py-2.5 text-sm font-normal transition-colors',
								isActive
									? 'bg-accent text-accent-foreground'
									: 'text-foreground/80 hover:bg-muted hover:text-foreground'
							)}
						>
							<Icon
								size={18}
								className={isActive ? 'text-accent-foreground' : 'text-foreground/80'}
							/>
							{label}
						</Link>
					);
				})}
			</nav>

			{/* Storage meter — uses fresh /api/users/me, not only localStorage */}
			{storage && (
				<div className='px-6 py-6 border-t border-border/10'>
					<div className='mb-3 flex items-center gap-2 text-sm text-foreground/80'>
						<HardDrive size={16} />
						<span>Storage</span>
					</div>
					<div className='h-1.5 w-full overflow-hidden rounded-full bg-muted'>
						<div
							className={cn(
								'h-full rounded-full transition-all',
								usedPct > 90 ? 'bg-destructive' : 'bg-primary'
							)}
							style={{ width: `${usedPct}%` }}
						/>
					</div>
					<p className='mt-2 text-[13px] text-foreground/60'>
						{formatBytes(storage.storageUsed)} of {formatBytes(storage.storageQuota)} used
					</p>
				</div>
			)}
		</aside>
	);
}
