import type {
    NestingProcessOperation,
    NestingProcessToolbarPrefs,
} from '../types/NestingTypes';
import {
    MAX_PINNED_PROCESS_FAVORITES,
    NESTING_PROCESS_ACTION_DEFS,
} from './RibbonDropdowns.processActionDefs';
import type {
    DropdownItem,
    NestingProcessActionDef,
    NestingProcessCapabilityMap,
    NestingProcessMenusResult,
} from './RibbonDropdowns.types';

const NESTING_PROCESS_GROUP_ORDER: Record<NestingProcessOperation, string[]> = {
    add: ['起点', '微连', '冷却点', '补偿', '封口'],
    delete: ['引线', '微连', '冷却点', '补偿', '封口'],
};

const NESTING_PROCESS_DEF_MAP: Record<string, NestingProcessActionDef> =
    NESTING_PROCESS_ACTION_DEFS.reduce<Record<string, NestingProcessActionDef>>((acc, def) => {
        acc[def.id] = def;
        return acc;
    }, {});

function getProcessUsage(
    prefs: NestingProcessToolbarPrefs,
    actionId: string,
): { count: number; lastUsedAt: number } {
    const stat = prefs.usageStats[actionId];
    if (!stat) {
        return { count: 0, lastUsedAt: 0 };
    }
    return {
        count: Number.isFinite(stat.count) ? stat.count : 0,
        lastUsedAt: Number.isFinite(stat.lastUsedAt) ? stat.lastUsedAt : 0,
    };
}

function sortByUsageAndRecency(
    defs: NestingProcessActionDef[],
    prefs: NestingProcessToolbarPrefs,
): NestingProcessActionDef[] {
    return defs.slice().sort((left, right) => {
        const leftStat = getProcessUsage(prefs, left.id);
        const rightStat = getProcessUsage(prefs, right.id);
        if (leftStat.count !== rightStat.count) {
            return rightStat.count - leftStat.count;
        }
        if (leftStat.lastUsedAt !== rightStat.lastUsedAt) {
            return rightStat.lastUsedAt - leftStat.lastUsedAt;
        }
        if (left.enabledByDefault !== right.enabledByDefault) {
            return Number(right.enabledByDefault) - Number(left.enabledByDefault);
        }
        return left.id.localeCompare(right.id);
    });
}

export function isNestingProcessActionId(actionId: string): boolean {
    return Boolean(NESTING_PROCESS_DEF_MAP[actionId]);
}

export function isNestingProcessActionExecutable(
    actionId: string,
    capabilityMap: NestingProcessCapabilityMap,
): boolean {
    const def = NESTING_PROCESS_DEF_MAP[actionId];
    if (!def) {
        return false;
    }
    const capabilityKey = def.capabilityRequired ?? def.id;
    return capabilityMap[capabilityKey] === true;
}

function toProcessLeafMenuItem(
    def: NestingProcessActionDef,
    capabilityMap: NestingProcessCapabilityMap,
    prefs: NestingProcessToolbarPrefs,
): DropdownItem {
    const executable = isNestingProcessActionExecutable(def.id, capabilityMap);
    const pinned = prefs.favorites.includes(def.id);
    return {
        id: def.id,
        label: executable ? def.label : `${def.label}（开发中）`,
        icon: def.icon,
        disabled: false,
        pinnable: true,
        pinned,
        pinLabel: pinned ? '取消固定' : '固定到常用',
    };
}

function buildProcessOperationMenu(
    operation: NestingProcessOperation,
    capabilityMap: NestingProcessCapabilityMap,
    prefs: NestingProcessToolbarPrefs,
): DropdownItem[] {
    const defs = NESTING_PROCESS_ACTION_DEFS.filter((def) => def.operation === operation);
    const groups = NESTING_PROCESS_GROUP_ORDER[operation];
    const grouped = new Map<string, NestingProcessActionDef[]>();

    defs.forEach((def) => {
        if (!grouped.has(def.groupLabel)) {
            grouped.set(def.groupLabel, []);
        }
        grouped.get(def.groupLabel)?.push(def);
    });

    return groups
        .map((groupLabel) => {
            const children = grouped
                .get(groupLabel)
                ?.map((def) => toProcessLeafMenuItem(def, capabilityMap, prefs)) ?? [];

            if (children.length === 0) {
                return null;
            }

            if (children.length === 1) {
                const single = children[0];
                const label = single.label.includes('（开发中）')
                    ? `${groupLabel}（开发中）`
                    : groupLabel;
                return {
                    ...single,
                    label,
                } satisfies DropdownItem;
            }

            return {
                id: `process-${operation}-${groupLabel}`,
                label: groupLabel,
                children,
            } satisfies DropdownItem;
        })
        .filter((item): item is DropdownItem => Boolean(item));
}

export function buildNestingProcessMenus(
    capabilityMap: NestingProcessCapabilityMap,
    prefs: NestingProcessToolbarPrefs,
): NestingProcessMenusResult {
    const defsByOperation = {
        add: NESTING_PROCESS_ACTION_DEFS.filter((def) => def.operation === 'add'),
        delete: NESTING_PROCESS_ACTION_DEFS.filter((def) => def.operation === 'delete'),
    };

    const primaryActionByOperation: Partial<Record<NestingProcessOperation, string>> = {};
    (['add', 'delete'] as NestingProcessOperation[]).forEach((operation) => {
        const preferred = prefs.primaryActionByOperation[operation];
        if (preferred && defsByOperation[operation].some((def) => def.id === preferred)) {
            primaryActionByOperation[operation] = preferred;
            return;
        }
        const ranked = sortByUsageAndRecency(defsByOperation[operation], prefs);
        if (ranked.length > 0) {
            primaryActionByOperation[operation] = ranked[0].id;
        }
    });

    const pinnedActions = prefs.favorites
        .map((actionId) => NESTING_PROCESS_DEF_MAP[actionId])
        .filter((def): def is NestingProcessActionDef => Boolean(def));
    const favoriteActions = pinnedActions.slice(0, MAX_PINNED_PROCESS_FAVORITES);

    return {
        addMenu: buildProcessOperationMenu('add', capabilityMap, prefs),
        deleteMenu: buildProcessOperationMenu('delete', capabilityMap, prefs),
        primaryActionByOperation,
        favoriteActions,
        defsById: NESTING_PROCESS_DEF_MAP,
    };
}
