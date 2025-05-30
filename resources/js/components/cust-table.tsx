import CustPagination from '@/components/cust-pagination';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PaginatedResponse } from '@/types';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import { CustAlertDialog } from './cust-alertdialog';
interface ColumnConfig<T> {
    key: keyof T | string;
    header: string;
    render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
    data: PaginatedResponse<T>;
    columns: ColumnConfig<T>[];
    onEdit?: (item: T) => void;
    onDelete?: (item: T) => { url: string; id: string | number };
    idKey: keyof T;
    onPageChange?: (page: number) => void;
}

export function CustTable<T>({ data, columns, onEdit, onDelete, idKey, onPageChange }: DataTableProps<T>) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<T | null>(null);
    const { delete: destroy, processing } = useForm();
    const handleDelete = (item: T) => {
        setSelectedItem(item);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (selectedItem && onDelete) {
            const { url, id } = onDelete(selectedItem);
            destroy(route(url, { id }), {
                onSuccess: () => {
                    setDeleteDialogOpen(false);
                    setSelectedItem(null);
                },
            });
        }
    };

    return (
        <>
            <Table>
                <TableHeader className="bg-primary-foreground">
                    <TableRow>
                        {columns.map((column) => (
                            <TableHead key={column.key as string}>{column.header}</TableHead>
                        ))}
                        {(onEdit || onDelete) && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data?.data.map((item) => (
                        <TableRow key={String(item[idKey])}>
                            {columns.map((column) => (
                                <TableCell key={column.key as string}>
                                    {column.render ? column.render(item) : String(item[column.key as keyof T] ?? '')}
                                </TableCell>
                            ))}
                            {(onEdit || onDelete) && (
                                <TableCell className="text-center">
                                    <div className="flex justify-end gap-2">
                                        {onEdit && (
                                            <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
                                                Edit
                                            </Button>
                                        )}
                                        {onDelete && (
                                            <Button variant="destructive" size="sm" onClick={() => handleDelete(item)} disabled={processing}>
                                                Delete
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <CustPagination paginateItems={data} onPageChange={onPageChange} />
            {onDelete && (
                <CustAlertDialog
                    isOpen={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    title="Are you absolutely sure?"
                    description="This action cannot be undone. This will permanently delete the item and remove its data from our servers."
                    confirmText="Delete"
                    cancelText="Cancel"
                    onConfirm={confirmDelete}
                    onCancel={() => setSelectedItem(null)}
                    variant="destructive"
                />
            )}
        </>
    );
}
