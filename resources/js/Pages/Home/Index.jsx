import { useMemo } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { AppNav, AppPageLayout } from '@/Components/Layout';
import { GROUP_FOCUS_QUERY, GroupsAndUsersPanel } from '@/Components/Groups';

/** Caminho de identifiers da raíz até ao grupo `targetId`, ou null. */
function findGroupIdPath(nodes, targetId, path = []) {
    if (!targetId || !Array.isArray(nodes)) {
        return null;
    }
    for (const n of nodes) {
        const id = n?.identifier;
        if (!id || typeof id !== 'string') {
            continue;
        }
        const next = [...path, id];
        if (id === targetId) {
            return next;
        }
        const kids = n.children;
        if (Array.isArray(kids) && kids.length > 0) {
            const hit = findGroupIdPath(kids, targetId, next);
            if (hit) {
                return hit;
            }
        }
    }
    return null;
}

/** Identifiers que devem ficar expandidos para o último do caminho ser visível. */
function ancestorExpandIds(path) {
    if (!path?.length) {
        return new Set();
    }
    return new Set(path.slice(0, -1));
}

export default function Home({ enableyTree, enableyError }) {
    const page = usePage();

    const tree = enableyTree?.tree ?? [];
    const focusGroupId = useMemo(() => {
        const qs = page.url.split('?')[1];
        if (!qs) {
            return '';
        }
        const v = new URLSearchParams(qs).get(GROUP_FOCUS_QUERY);
        return typeof v === 'string' ? v.trim() : '';
    }, [page.url]);

    const forceExpandedIds = useMemo(() => {
        const path = findGroupIdPath(tree, focusGroupId);
        return ancestorExpandIds(path);
    }, [tree, focusGroupId]);

    return (
        <>
            <Head title="Grupos" />
            <AppPageLayout>
                <AppNav />
                <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-10 pt-4 sm:px-6">
                    <GroupsAndUsersPanel
                        enableyError={enableyError}
                        enableyTree={enableyTree}
                        showOrphanUserSections={false}
                        focusGroupIdentifier={focusGroupId}
                        forceExpandedIds={forceExpandedIds}
                    />
                </main>
            </AppPageLayout>
        </>
    );
}
