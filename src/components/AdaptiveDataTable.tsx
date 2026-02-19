import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';

interface Column<T> {
    header: string;
    key: keyof T | string;
    render?: (item: T) => React.ReactNode;
    className?: string;
}

interface Action<T> {
    icon: React.ReactNode;
    label: string;
    onClick: (item: T) => void;
    variant?: 'edit' | 'delete' | 'default';
}

interface AdaptiveDataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    actions?: Action<T>[];
    onRowClick?: (item: T) => void;
    mobileCardTitle: (item: T) => string;
    mobileCardSubtitle?: (item: T) => string;
    mobileCardBadge?: (item: T) => React.ReactNode;
    mobileCardRightContent?: (item: T) => React.ReactNode;
}

export function AdaptiveDataTable<T extends { id: string | number }>({
    data,
    columns,
    actions,
    onRowClick,
    mobileCardTitle,
    mobileCardSubtitle,
    mobileCardBadge,
    mobileCardRightContent
}: AdaptiveDataTableProps<T>) {
    return (
        <div className="w-full">
            {/* Desktop View: Premium Table */}
            <div className="desktop-table-view premium-table-container shadow-2xl custom-scrollbar">
                <table className="premium-table">
                    <thead>
                        <tr>
                            {columns.map((col, idx) => (
                                <th key={idx} className={col.className}>{col.header}</th>
                            ))}
                            {actions && <th className="text-right">ACTIONS</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item) => (
                            <tr key={item.id} onClick={() => onRowClick?.(item)} className="cursor-pointer">
                                {columns.map((col, idx) => (
                                    <td key={idx} className={col.className}>
                                        {col.render ? col.render(item) : (item[col.key as keyof T] as unknown as React.ReactNode)}
                                    </td>
                                ))}
                                {actions && (
                                    <td className="text-right" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex justify-end gap-2">
                                            {actions.map((action, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => action.onClick(item)}
                                                    className={`btn-action-premium ${action.variant || ''}`}
                                                    title={action.label}
                                                >
                                                    {action.icon}
                                                </button>
                                            ))}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile View: Dynamic Cards */}
            <div className="mobile-card-view space-y-4">
                <div className="adaptive-grid">
                    {data.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => onRowClick?.(item)}
                            className="premium-card p-4 flex flex-col gap-3 active:scale-[0.98] transition-all"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    {mobileCardBadge?.(item)}
                                    <div className="flex flex-col">
                                        <h3 className="font-black text-white text-base leading-tight uppercase">
                                            {mobileCardTitle(item)}
                                        </h3>
                                        {mobileCardSubtitle && (
                                            <p className="text-xs text-muted font-medium">
                                                {mobileCardSubtitle(item)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {mobileCardRightContent?.(item)}
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                                {actions?.map((action, idx) => (
                                    <button
                                        key={idx}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            action.onClick(item);
                                        }}
                                        className={`btn-action-premium ${action.variant || ''}`}
                                    >
                                        {action.icon}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
