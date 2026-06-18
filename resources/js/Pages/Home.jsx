import { useEffect, useMemo, useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { AppNav, AppPageLayout } from '@/Components/layout';
import SubAccountHeader from '@/Components/subaccount/SubAccountHeader';
import {
    CreateGroupDrawer,
    DeleteGroupConfirmModal,
    EditGroupDrawer,
    GROUP_FOCUS_QUERY,
    GroupsAndUsersPanel,
} from '@/Components/groups';

function buildGroupIdentifierToNameMap(nodes) {
    const map = new Map();
    const walk = (list) => {
        if (!Array.isArray(list)) {
            return;
        }
        for (const n of list) {
            if (n?.identifier) {
                map.set(n.identifier, n.name ?? n.identifier);
            }
            walk(n.children);
        }
    };
    walk(nodes);
    return map;
}

function resolveTypeForSelect(nodeType, groupTypes) {
    if (!groupTypes?.length) {
        return '';
    }
    if (nodeType == null || nodeType === '') {
        return '';
    }
    const u = String(nodeType).toLocaleUpperCase('pt-PT');
    const hit = groupTypes.find((t) => String(t).toLocaleUpperCase('pt-PT') === u);
    return hit !== undefined ? String(hit) : '';
}

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

export default function Home({ enableyTree, enableyError, enableyGroupTypes = [] }) {
    const page = usePage();
    const { enabley } = page.props;
    const activeSubAccount = enabley?.activeSubAccount ?? '';

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [parentForCreate, setParentForCreate] = useState(null);
    const [editDrawerOpen, setEditDrawerOpen] = useState(false);
    const [deleteGroupNode, setDeleteGroupNode] = useState(null);
    const [deleteProcessing, setDeleteProcessing] = useState(false);

    const groupNameByIdentifier = useMemo(
        () => buildGroupIdentifierToNameMap(enableyTree?.tree ?? []),
        [enableyTree],
    );

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

    const form = useForm({
        name: '',
        type: '',
        parent_identifier: '',
    });

    const editForm = useForm({
        identifier: '',
        name: '',
        type: '',
        parent_identifier: '',
    });

    const closeDrawer = () => {
        setDrawerOpen(false);
        form.reset();
    };

    const closeEditDrawer = () => {
        setEditDrawerOpen(false);
        editForm.reset();
    };

    const openCreateGroup = (parentNode) => {
        setEditDrawerOpen(false);
        editForm.clearErrors();
        setParentForCreate(parentNode);
        form.clearErrors();
        form.setData({
            name: '',
            type: '',
            parent_identifier: parentNode?.identifier ?? '',
        });
        setDrawerOpen(true);
    };

    const openEditGroup = (node) => {
        setDrawerOpen(false);
        form.clearErrors();
        editForm.clearErrors();
        editForm.setData({
            identifier: node.identifier ?? '',
            name: node.name ?? '',
            type: resolveTypeForSelect(node.type, enableyGroupTypes),
            parent_identifier: node.parentIdentifier ?? '',
        });
        setEditDrawerOpen(true);
    };

    const openDeleteGroup = (node) => {
        if (!node?.identifier) {
            return;
        }
        setDrawerOpen(false);
        setEditDrawerOpen(false);
        setDeleteGroupNode(node);
    };

    const closeDeleteGroup = () => {
        if (deleteProcessing) {
            return;
        }
        setDeleteGroupNode(null);
    };

    const confirmDeleteGroup = () => {
        const id = deleteGroupNode?.identifier;
        if (!id) {
            return;
        }
        setDeleteProcessing(true);
        router.delete(`/grupos/${encodeURIComponent(id)}`, {
            preserveScroll: true,
            onFinish: () => setDeleteProcessing(false),
            onSuccess: () => setDeleteGroupNode(null),
        });
    };

    const anyDrawerOpen = drawerOpen || editDrawerOpen || deleteGroupNode;

    useEffect(() => {
        if (!anyDrawerOpen) {
            return undefined;
        }
        const onKey = (e) => {
            if (e.key === 'Escape') {
                if (deleteGroupNode) {
                    if (!deleteProcessing) {
                        setDeleteGroupNode(null);
                    }
                } else if (editDrawerOpen) {
                    closeEditDrawer();
                } else {
                    closeDrawer();
                }
            }
        };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [anyDrawerOpen, deleteGroupNode, deleteProcessing, editDrawerOpen]);

    return (
        <>
            <Head title="Grupos" />
            <AppPageLayout>
                <AppNav />
                <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-10 pt-4 sm:px-6">
                    <SubAccountHeader subAccountName={activeSubAccount} />
                    <GroupsAndUsersPanel
                        enableyError={enableyError}
                        enableyTree={enableyTree}
                        groupTypes={enableyGroupTypes}
                        onOpenCreateGroup={openCreateGroup}
                        onOpenEditGroup={openEditGroup}
                        onDeleteGroup={openDeleteGroup}
                        showOrphanUserSections={false}
                        focusGroupIdentifier={focusGroupId}
                        forceExpandedIds={forceExpandedIds}
                    />
                </main>
            </AppPageLayout>

            <CreateGroupDrawer
                open={drawerOpen}
                onClose={closeDrawer}
                parentGroup={parentForCreate}
                groupTypes={enableyGroupTypes}
                form={form}
                postOptions={{
                    onSuccess: () => {
                        setDrawerOpen(false);
                        form.reset();
                    },
                }}
            />

            <EditGroupDrawer
                open={editDrawerOpen}
                onClose={closeEditDrawer}
                groupTypes={enableyGroupTypes}
                form={editForm}
                parentGroupName={
                    editForm.data.parent_identifier
                        ? groupNameByIdentifier.get(editForm.data.parent_identifier) ?? null
                        : null
                }
                putOptions={{
                    onSuccess: () => {
                        setEditDrawerOpen(false);
                        editForm.reset();
                    },
                }}
            />

            <DeleteGroupConfirmModal
                open={!!deleteGroupNode}
                groupNode={deleteGroupNode}
                onClose={closeDeleteGroup}
                onConfirm={confirmDeleteGroup}
                processing={deleteProcessing}
            />
        </>
    );
}
