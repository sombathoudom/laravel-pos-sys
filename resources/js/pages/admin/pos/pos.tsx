import InvoiceModal from '@/components/invoice-modal';
import CustPagination from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useDebounce from '@/hooks/useDebounce';
import { formatCurrency } from '@/lib/utils';
import { PageProps } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    ArrowLeftToLine,
    Barcode,
    CreditCard,
    DollarSign,
    Edit2,
    Filter,
    Minus,
    Package,
    Paintbrush,
    Plus,
    RefreshCcw,
    Search,
    Shirt,
    ShoppingCart,
    UserPlus,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';

interface Customer {
    id: number;
    name: string;
    phone: string;
    address: string;
}

interface Variant {
    id: number;
    name: string;
    price: number;
    stock: number;
}

interface Product {
    key: string;
    id: number | string;
    name: string;
    price: number;
    code: string;
    size: string;
    color: string;
    image: string;
    category_id: number;
    type: 'single' | 'variant';
    current_stock: number;
    variant_id: number;
    quantity?: number;
}

interface CartItem extends Product {
    quantity: number;
    selectedVariant?: Variant;
    discount: number;
}

export interface Invoice {
    invoice_number: string;
    total_amount_usd: number;
    total_amount_khr: number;
    delivery_fee: number;
    transaction_date: string;
    customer: Customer;
    products: Product[];
}
export interface POSProps {
    productss?: {
        data: Product[];
        current_page: number;
        last_page: number;
    };
}

export default function POS({ productss }: POSProps) {
    const { categories } = usePage<PageProps>().props;
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [discount, setDiscount] = useState(0);
    const [deliveryFee, setDeliveryFee] = useState(2);
    const [editingItem, setEditingItem] = useState<CartItem | null>(null);
    const [showInvoice, setShowInvoice] = useState(false);
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
    const [customerSearch, setCustomerSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalKhr, setTotalKhr] = useState(0);
    const [status, setStatus] = useState('unpaid');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer>({
        id: 1,
        name: 'Walk-in Customer',
        phone: 'N/A',
        address: 'N/A',
    });
    const [newCustomer, setNewCustomer] = useState<Omit<Customer, 'id'>>({
        name: '',
        phone: '',
        address: '',
    });
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await axios.get(route('customers.index'));
                setCustomers(response.data);
            } catch (error) {
                console.error('Error fetching customers:', error);
            } finally {
                setIsLoadingCustomers(false);
            }
        };

        fetchCustomers();
    }, []);

    const handleCreateCustomer = async () => {
        const response = await axios.post(route('customers.store'), {
            name: newCustomer.name,
            phone: newCustomer.phone,
            address: newCustomer.address,
        });
        setSelectedCustomer({
            id: response.data.id,
            name: response.data.name,
            phone: response.data.phone,
            address: response.data.address,
        });
        setCustomers([...customers, response.data]);
        setShowNewCustomerModal(false);
        setNewCustomer({ name: '', phone: '', address: '' });
    };
    const addToCart = (product: Product) => {
        setCart((prevCart) => {
            const existingItem = prevCart.find((item) => item.key === product.key);
            if (existingItem) {
                return prevCart.map((item) =>
                    item.key === product.key
                        ? {
                              ...item,
                              quantity: item.quantity < product.current_stock ? item.quantity + 1 : item.quantity,
                          }
                        : item,
                );
            }
            return [
                ...prevCart,
                {
                    ...product,
                    quantity: 1,
                    discount: 0,
                },
            ];
        });
    };

    const removeFromCart = (productKey: string) => {
        setCart((prevCart) => prevCart.filter((item) => item.key !== productKey));
    };

    const updateQuantity = (productId: string, change: number) => {
        setCart((prevCart) =>
            prevCart
                .map((item) => {
                    if (item.key === productId) {
                        return {
                            ...item,
                            quantity: item.quantity + change,
                        };
                    }
                    return item;
                })
                .filter((item) => item.quantity > 0),
        );
    };

    const updateItemDiscount = (productId: string, discount: number) => {
        setCart((prevCart) => prevCart.map((item) => (item.key === productId ? { ...item, discount } : item)));
    };

    const getItemPrice = (item: CartItem) => {
        return item.price - item.discount;
    };
    const subtotal = cart.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0);
    const total = subtotal + deliveryFee - discount;

    // const printInvoice = () => {
    //     const printWindow = window.open('', '_blank');
    //     if (printWindow) {
    //         printWindow.document.write(`
    //             <html>
    //                 <head>
    //                     <title>Invoice</title>
    //                     <style>
    //                         body { font-family: Arial, sans-serif; }
    //                         .invoice { max-width: 300px; margin: 0 auto; }
    //                         .header { text-align: center; margin-bottom: 20px; }
    //                         .customer { margin-bottom: 20px; }
    //                         .item { margin: 10px 0; }
    //                         .total { margin-top: 20px; border-top: 1px solid #ccc; padding-top: 10px; }
    //                     </style>
    //                 </head>
    //                 <body>
    //                     <div class="invoice">
    //                         <div class="header">
    //                             <h2>INVOICE</h2>
    //                             <p>${invoice?.invoiceNumber}</p>
    //                             <p>${invoice?.date.toLocaleString()}</p>
    //                         </div>
    //                         <div class="customer">
    //                             <h3>Customer Details</h3>
    //                             <p>Name: ${invoice?.customer.name}</p>
    //                             <p>Phone: ${invoice?.customer.phone}</p>
    //                             <p>Location: ${invoice?.customer.location}</p>
    //                         </div>
    //                         ${invoice?.items
    //                             .map(
    //                                 (item) => `
    //                             <div class="item">
    //                                 <p>${item.name} ${item.selectedVariant ? `(${item.selectedVariant.name})` : ''}</p>
    //                                 <p>${item.quantity} x $${getItemPrice(item).toFixed(2)}</p>
    //                             </div>
    //                         `,
    //                             )
    //                             .join('')}
    //                         <div class="total">
    //                             <p>Subtotal: $${invoice?.subtotal.toFixed(2)}</p>
    //                             <p>Delivery: $${invoice?.deliveryFee.toFixed(2)}</p>
    //                             <p>Discount: $${invoice?.discount.toFixed(2)}</p>
    //                             <h3>Total: $${invoice?.total.toFixed(2)}</h3>
    //                         </div>
    //                     </div>
    //                 </body>
    //             </html>
    //         `);
    //         printWindow.document.close();
    //         printWindow.print();
    //     }
    // };
    const searchProducts = useDebounce({
        value: searchQuery,
        delay: 100,
    });

    const handleSearch = (isClear: boolean = false) => {
        const params = isClear
            ? { search: '', category: '' }
            : {
                  search: searchProducts ?? '',
                  category: selectedCategory === 'all' ? '' : selectedCategory,
              };

        if (isClear) {
            setSearchQuery('');
            setSelectedCategory('');
        }

        router.get(route('pos.index'), params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSaleProducts = () => {
        axios
            .post(route('pos.saleProducts'), {
                products: cart,
                customer_id: selectedCustomer.id,
                status: status,
                discount: discount,
                total_khr: totalKhr,
                deliveryFee: deliveryFee,
                total: total,
            })
            .then((response) => {
                router.reload({ only: ['productss'] });
                setCart([]);
                setDiscount(0);
                setInvoice(response.data.data);
                toast.success('Sale products successfully');
            })
            .catch((error) => {
                console.error('Error fetching products:', error);
            });
    };

    const handleTotalKhr = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value === '') {
            setTotalKhr((subtotal + deliveryFee - discount) * 4100);
        } else {
            setTotalKhr(Number(e.target.value));
        }
    };

    useEffect(() => {
        setTotalKhr((subtotal + deliveryFee - discount) * 4100);
    }, [subtotal, deliveryFee, discount]);

    return (
        <div>
            <Head title="POS" />
            <Toaster richColors position="top-right" />
            <div className="flex h-screen">
                {/* Left side - Products */}
                <div className="w-2/3 overflow-y-auto p-6">
                    <div className="mb-6 space-y-4">
                        <div className="flex items-center gap-4">
                            {/* Customer Selection */}
                            <Button variant="outline" onClick={() => router.get(route('pos.index'))}>
                                <RefreshCcw />
                            </Button>
                            <Button variant="outline" onClick={() => router.get(route('dashboard.index'))}>
                                <ArrowLeftToLine />
                                Back
                            </Button>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Select
                                value={selectedCustomer.id.toString()}
                                onValueChange={(value) =>
                                    setSelectedCustomer(
                                        customers.find((customer) => customer.id.toString() === value) ?? {
                                            id: 1,
                                            name: 'Walk-in Customer',
                                            phone: 'N/A',
                                            address: 'N/A',
                                        },
                                    )
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Customer" />
                                </SelectTrigger>
                                <SelectContent>
                                    {customers.map((customer) => (
                                        <SelectItem key={customer.id} value={customer.id.toString()}>
                                            {customer.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button onClick={() => setShowNewCustomerModal(true)} className="flex items-center space-x-2">
                                <UserPlus size={20} />
                            </Button>
                        </div>

                        {/* Product Search */}
                        <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-2">
                                <Filter className="text-gray-400" size={20} />
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" onClick={() => setSelectedCategory('')}>
                                            All
                                        </SelectItem>
                                        {categories.map((category) => (
                                            <SelectItem
                                                key={category.category_id.toString()}
                                                value={category.category_id.toString()}
                                                onClick={() => setSelectedCategory(category.category_id.toString())}
                                            >
                                                {category.category_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-400" size={20} />
                                <Input
                                    type="text"
                                    placeholder="Search products..."
                                    className="pl-10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    handleSearch(true);
                                }}
                            >
                                Clear
                            </Button>
                            <Button variant="outline" onClick={() => handleSearch(false)}>
                                Search
                            </Button>
                        </div>

                        {/* Category Filter */}
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-5">
                        {productss?.data.map((product) => (
                            <Card key={product.id} className="gap-4 overflow-hidden p-0">
                                <CardHeader className="p-0">
                                    <div className="aspect-square rounded-md">
                                        {product.image ? (
                                            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-gray-200">
                                                <p className="text-sm text-gray-500">No image</p>
                                            </div>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2 px-2">
                                    <h3 className="line-clamp-2 text-sm font-semibold">{product.name}</h3>
                                    <p className="flex items-center gap-2 text-xs text-gray-500">
                                        <Barcode size={12} />
                                        {product.code}
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Badge variant="outline">
                                            <Package />
                                            {product.current_stock}
                                        </Badge>
                                        <Badge variant="outline">
                                            <Shirt />
                                            {product.size}
                                        </Badge>
                                        <Badge variant="outline">
                                            <Paintbrush />
                                            {product.color}
                                        </Badge>
                                        <Badge variant="outline">
                                            <DollarSign />
                                            {formatCurrency(product.price)}
                                        </Badge>
                                    </div>
                                </CardContent>
                                <CardFooter className="p-3 pt-0">
                                    <Button onClick={() => addToCart(product)} className="w-full text-xs" size="sm">
                                        <Plus />
                                        Add to Cart
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                    <div className="mt-4">
                        <CustPagination
                            currentPage={productss?.current_page ?? 1}
                            lastPage={productss?.last_page ?? 1}
                            onPageChange={(page) => router.get(route('pos.index'), { page }, { preserveScroll: true, preserveState: true })}
                        />
                    </div>
                </div>

                {/* Right side - Cart and Payment */}
                <div className="flex w-1/3 flex-col border-l border-gray-200 bg-white">
                    <div className="border-b border-gray-200 p-6">
                        <h2 className="flex items-center text-2xl font-bold text-gray-800">
                            <ShoppingCart className="mr-2" size={24} />
                            Current Order
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2">
                        {cart.map((item) => (
                            <div key={item.key} className="mb-4 flex items-center justify-between border-b border-gray-200 pb-4">
                                <div className="flex items-center">
                                    <div className="mr-3 h-14 w-14 rounded-lg">
                                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                    </div>
                                    <div className="flex w-full items-center">
                                        <div className="flex flex-col">
                                            <p className="text-sm font-medium text-gray-800">{item.name}</p>
                                            <div className="flex items-center space-x-2">
                                                <p className="text-xs font-medium text-gray-800">{formatCurrency(getItemPrice(item))}</p>
                                                {item.discount > 0 && <span className="text-sm text-red-500">-${formatCurrency(item.discount)}</span>}
                                            </div>
                                        </div>
                                        <Button variant="link" size="icon" onClick={() => setEditingItem(item)}>
                                            <Edit2 size={12} />
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="relative">
                                        <Button className="absolute left-0" size="icon" onClick={() => updateQuantity(item.key, -1)}>
                                            <Minus size={16} />
                                        </Button>
                                        <Input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => {
                                                const newValue = e.target.value === '' ? 0 : Number(e.target.value);
                                                const change = newValue - item.quantity;
                                                if (newValue >= 0 && newValue <= item.current_stock) {
                                                    updateQuantity(item.key, change);
                                                }
                                            }}
                                            className="w-full text-center"
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center">
                                            <Button
                                                size="icon"
                                                onClick={() => {
                                                    if (item.quantity < item.current_stock) {
                                                        updateQuantity(item.key, 1);
                                                    }
                                                }}
                                            >
                                                <Plus size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                    <Button variant="destructive" size="icon" onClick={() => removeFromCart(item.key)}>
                                        <X size={16} />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-gray-200 p-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-gray-600">Status</span>
                                <Select value={status} onValueChange={(value) => setStatus(value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="paid">Paid</SelectItem>
                                        <SelectItem value="unpaid">Unpaid</SelectItem>
                                        <SelectItem value="partial_paid">Partial Paid</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-semibold">{formatCurrency(subtotal)}</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Delivery Fee</span>
                                <Input
                                    type="number"
                                    value={deliveryFee}
                                    onChange={(e) => setDeliveryFee(Number(e.target.value))}
                                    className="w-24 text-right"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Total KHR</span>
                                <Input type="number" value={totalKhr} onChange={handleTotalKhr} className="w-24 text-right" />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Order Discount</span>
                                <Input
                                    type="number"
                                    value={discount}
                                    onChange={(e) => setDiscount(Number(e.target.value))}
                                    className="w-24 text-right"
                                />
                            </div>
                            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                                <span className="text-lg font-bold text-gray-800">Total</span>
                                <span className="text-lg font-bold text-blue-600">{formatCurrency(total)}</span>
                            </div>
                        </div>
                        <div className="mt-6 space-y-3">
                            <Button onClick={handleSaleProducts} className="w-full" disabled={cart.length === 0}>
                                <CreditCard className="mr-2" size={20} />
                                Complete Sale
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Edit Item Dialog */}
                {editingItem && (
                    <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Item</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Item Discount</Label>
                                    <Input
                                        type="number"
                                        value={editingItem.discount}
                                        onChange={(e) => {
                                            const newDiscount = Number(e.target.value);
                                            updateItemDiscount(editingItem.key, newDiscount);
                                            setEditingItem({
                                                ...editingItem,
                                                discount: newDiscount,
                                            });
                                        }}
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setEditingItem(null)}>
                                    Cancel
                                </Button>
                                <Button onClick={() => setEditingItem(null)}>Save</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}

                {/* New Customer Dialog */}
                <Dialog open={showNewCustomerModal} onOpenChange={setShowNewCustomerModal}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Customer</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={newCustomer.name}
                                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                    placeholder="Customer name"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={newCustomer.phone}
                                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                    placeholder="Phone number"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    value={newCustomer.address}
                                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                                    placeholder="Customer location"
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowNewCustomerModal(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreateCustomer}>Add Customer</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {invoice && <InvoiceModal invoice={invoice} onClose={() => setInvoice(null)} />}
            </div>
        </div>
    );
}
