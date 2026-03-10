import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@tanstack/react-store';
import { useState } from 'react';
import { api } from '@/lib/api';
import { driveKeys } from '@/lib/drive-queries';
import { formatBytes, formatDate } from '@/lib/format';
import { useFilePreview } from '@/contexts/file-preview';
import { useShareDialog } from '@/contexts/share-dialog';
import { toast } from '@/store/toast';
import type { DriveFile } from '@/types/drive';
import { uiStore } from '@/store/ui';
import { cn } from '@/lib/utils';
import { FileIcon } from './FileIcon';
import { ItemMenu, menuActions } from './ItemMenu';
import { RenameDialog } from './RenameDialog';

interface Props {
	file: DriveFile;
	parentQueryKey: readonly unknown[];
	isTrash?: boolean;
}

export function FileCard({ file, parentQueryKey, isTrash = false }: Props) {
	const viewMode = useStore(uiStore, (s) => s.viewMode);
	const { openShareDialog } = useShareDialog();
	const { openPreview } = useFilePreview();
	const qc = useQueryClient();
	const [renaming, setRenaming] = useState(false);

	const download = useMutation({
		mutationFn: () => api.get<{ downloadUrl: string }>(`/api/files/${file.id}/download`),
		onSuccess: ({ downloadUrl }) => window.open(downloadUrl, '_blank'),
		onError: () => toast('Failed to get download link', 'error'),
	});

	const trash = useMutation({
		mutationFn: () => api.delete(`/api/files/${file.id}`),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: parentQueryKey });
			toast('Moved to trash', 'default');
		},
		onError: () => toast('Failed to move file to trash', 'error'),
	});

	const restore = useMutation({
		mutationFn: () => api.post(`/api/files/${file.id}/restore`),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: driveKeys.trash() });
			qc.invalidateQueries({ queryKey: driveKeys.rootContents() });
			toast('File restored', 'success');
		},
		onError: () => toast('Failed to restore file', 'error'),
	});

	const rename = useMutation({
		mutationFn: (name: string) => api.patch(`/api/files/${file.id}`, { name }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: parentQueryKey });
			setRenaming(false);
			toast('File renamed', 'success');
		},
		onError: () => toast('Failed to rename file', 'error'),
	});

	const handleCardClick = () => {
		if (!isTrash) openPreview({ source: 'own', file });
	};

	const actions = isTrash
		? [menuActions.restore(() => restore.mutate())]
		: [
				menuActions.open(() => openPreview({ source: 'own', file })),
				menuActions.download(() => download.mutate()),
				menuActions.share(() => openShareDialog(file)),
				menuActions.rename(() => setRenaming(true)),
				menuActions.trash(() => trash.mutate()),
			];

	return (
		<>
			{viewMode === 'grid' ? (
				<div
					role='button'
					tabIndex={0}
					onClick={(e) => {
						if ((e.target as HTMLElement).closest('[data-menu]')) return;
						handleCardClick();
					}}
					onKeyDown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							handleCardClick();
						}
					}}
					className={cn(
						'group relative flex flex-col items-center bg-card justify-center rounded-2xl border border-transparent p-4 transition',
						!isTrash && 'hover:bg-muted/40 hover:border-border/40 cursor-pointer',
						isTrash && 'opacity-70 cursor-default'
					)}
				>
					{/* File Icon (Top) */}
					<div className='mb-4 flex h-24 w-full items-center justify-center rounded-xl bg-muted/20'>
						<FileIcon
							mimeType={file.mimeType}
							size={48}
							className='text-foreground/80'
						/>
					</div>

					{/* Details (Bottom) */}
					<div className='flex w-full items-center justify-between gap-2 px-1'>
						<div className='flex min-w-0 flex-1 items-center gap-2'>
							<span className='shrink-0 flex items-center justify-center'>
								<FileIcon
									mimeType={file.mimeType}
									size={14}
									className='text-muted-foreground'
								/>
							</span>
							<p className='truncate text-sm font-normal text-foreground'>{file.name}</p>
						</div>

						<div
							data-menu
							className=''
							onClick={(e) => e.stopPropagation()}
						>
							<ItemMenu actions={actions} />
						</div>
					</div>
				</div>
			) : (
				<div
					role='button'
					tabIndex={0}
					onClick={(e) => {
						if ((e.target as HTMLElement).closest('[data-menu]')) return;
						handleCardClick();
					}}
					onKeyDown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							handleCardClick();
						}
					}}
					className={cn(
						'group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2 transition',
						!isTrash && 'hover:bg-muted/40 cursor-pointer',
						isTrash && 'opacity-70 cursor-default'
					)}
				>
					<span className='flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/30'>
						<FileIcon
							mimeType={file.mimeType}
							size={14}
							className='text-muted-foreground'
						/>
					</span>
					<span className='flex-1 truncate text-sm font-normal text-foreground'>{file.name}</span>
					<span className='shrink-0 text-xs text-muted-foreground'>{formatBytes(file.size)}</span>
					<span className='hidden shrink-0 text-xs text-muted-foreground sm:block'>
						{formatDate(file.updatedAt)}
					</span>
					<div
						data-menu
						className='opacity-0 transition-opacity group-hover:opacity-100'
						onClick={(e) => e.stopPropagation()}
					>
						<ItemMenu actions={actions} />
					</div>
				</div>
			)}

			<RenameDialog
				open={renaming}
				currentName={file.name}
				onClose={() => setRenaming(false)}
				onSubmit={(name) => rename.mutate(name)}
				isPending={rename.isPending}
			/>
		</>
	);
}
