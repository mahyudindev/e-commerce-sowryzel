import { Head, Link, router } from '@inertiajs/react';
import AppTopbarLayout from '@/layouts/app-topbar-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatRupiah } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2 } from 'lucide-react';



interface CheckoutItemProduk {
    produk_id: number;
    nama_produk: string;
    harga: number;
    stok: number;
    berat: number; // in grams
    gambar: Array<{ path: string; url: string }>;
}

interface CheckoutItem {
    id_keranjang: number;
    jumlah: number;
    subtotal: number;
    harga_satuan: number;
    produk: CheckoutItemProduk;
}

interface CustomerData {
    nama_lengkap: string;
    no_telepon: string;
    alamat: string;
    kode_pos: string;
}

interface CheckoutPageProps {
    checkoutItems: CheckoutItem[];
    totalHarga: number;
    totalBerat: number;
    customerData: CustomerData;
}

declare global {
    interface Window {
        snap: any; // You can define a more specific type if available from Midtrans
    }
}

export default function CheckoutPage(props: CheckoutPageProps) {
    const { checkoutItems, totalHarga, totalBerat, customerData } = props;
    const [isLoading, setIsLoading] = useState(false);
    const [customerNotes, setCustomerNotes] = useState(''); // Untuk submit order
    const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
    const [isLoadingCities, setIsLoadingCities] = useState(false);
    const [isLoadingShipping, setIsLoadingShipping] = useState(false);

    interface RajaOngkirProvince {
        province_id: string;
        province: string;
    }

    interface RajaOngkirCity {
        city_id: string;
        city_name: string;
        type: string;
        postal_code: string;
    }

    interface RajaOngkirService {
        service: string;
        description: string;
        cost: Array<{
            value: number;
            etd: string;
            note: string;
        }>;
    }

    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [provinces, setProvinces] = useState<RajaOngkirProvince[]>([]);
    const [cities, setCities] = useState<RajaOngkirCity[]>([]);

    const [shippingCost, setShippingCost] = useState(0);
    const [selectedCourier, setSelectedCourier] = useState('');
    const [availableServices, setAvailableServices] = useState<RajaOngkirService[]>([]);
    const [selectedService, setSelectedService] = useState('');
    const [customerName, setCustomerName] = useState(customerData?.nama_lengkap || '');
    const [customerPhone, setCustomerPhone] = useState(customerData?.no_telepon || '');
    const [customerAddress, setCustomerAddress] = useState(customerData?.alamat || '');
    const [customerPostalCode, setCustomerPostalCode] = useState(customerData?.kode_pos || '');

    const grandTotal = totalHarga + shippingCost;

    useEffect(() => {
        const fetchProvinces = async () => {
            setIsLoadingProvinces(true);
            try {
                const response = await fetch('/api/rajaongkir/provinces');
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Gagal mengambil data provinsi.');
                }
                const data = await response.json();
                setProvinces(data.data || []);
            } catch (error: any) {
                toast.error(error.message || 'Terjadi kesalahan saat mengambil provinsi.');
                console.error("Error fetching provinces:", error);
            } finally {
                setIsLoadingProvinces(false);
            }
        };
        fetchProvinces();
    }, []);

    const handleProvinceChange = async (provinceId: string) => {
        console.log('Selected Province ID:', provinceId);
        setSelectedProvince(provinceId);
        setSelectedCity('');
        setCities([]);
        setSelectedCourier('');
        setAvailableServices([]);
        setSelectedService('');
        setShippingCost(0);

        if (!provinceId) return;

        setIsLoadingCities(true);
        try {
            const response = await fetch(`/api/rajaongkir/cities?province_id=${provinceId}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Gagal mengambil data kota.');
            }
            const data = await response.json();
            setCities(data.data || []);
        } catch (error: any) {
            toast.error(error.message || 'Terjadi kesalahan saat mengambil kota.');
            console.error("Error fetching cities:", error);
        } finally {
            setIsLoadingCities(false);
        }
    };

    const handleCityChange = (cityId: string) => {
        console.log('Selected City ID:', cityId);
        setSelectedCity(cityId);
        setSelectedCourier('');
        setAvailableServices([]);
        setSelectedService('');
        setShippingCost(0);
    };

    const handleCourierChange = async (courierCode: string) => {
        setSelectedCourier(courierCode);
        setAvailableServices([]);
        setSelectedService('');
        setShippingCost(0);

        if (!courierCode || !selectedCity || totalBerat <= 0) {
            if (totalBerat <= 0 && courierCode && selectedCity) toast.error("Berat produk tidak valid (0 gram). Tidak dapat menghitung ongkir.");
            return;
        }

        setIsLoadingShipping(true);
        try {
            const response = await fetch('/api/rajaongkir/shipping-cost', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    destination_city_id: selectedCity,
                    weight: totalBerat,
                    courier: courierCode,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || errorData.error || 'Gagal menghitung ongkos kirim.');
            }
            const result = await response.json();
            if (result.data && result.data.length > 0) {
                setAvailableServices(result.data);
            } else {
                toast.info(result.message || 'Tidak ada layanan pengiriman yang tersedia.');
                setAvailableServices([]);
            }
        } catch (error: any) {
            toast.error(error.message || 'Terjadi kesalahan saat menghitung ongkir.');
            console.error("Error calculating shipping cost:", error);
            setAvailableServices([]);
        } finally {
            setIsLoadingShipping(false);
        }
    };

    const handleServiceChange = (serviceCode: string) => {
        const selected = availableServices.find(s => s.service === serviceCode);
        if (selected && selected.cost.length > 0) {
            setSelectedService(selected.service);
            setShippingCost(selected.cost[0].value);
        } else {
            setSelectedService('');
            setShippingCost(0);
        }
    };

    const handleSubmitOrder = async () => {
        if (!customerName || !customerPhone || !customerAddress || !selectedProvince || !selectedCity || !customerPostalCode) {
            toast.error("Harap lengkapi semua detail alamat pengiriman.");
            return;
        }
        if (!selectedCourier || !selectedService || shippingCost <= 0) {
            toast.error("Harap pilih kurir dan layanan pengiriman.");
            return;
        }
        if (checkoutItems.length === 0) {
            toast.error("Keranjang Anda kosong.");
            return;
        }

        setIsLoading(true);
        toast.info("Memproses transaksi Anda...");

        const selectedProvinceObj = provinces.find(p => p.province_id === selectedProvince);
        const selectedCityObj = cities.find(c => c.city_id === selectedCity);

        const orderPayload = {
            items: checkoutItems.map(item => ({
                produk_id: item.produk.produk_id,
                keranjang_id: item.id_keranjang, // <-- Tambahkan ini
                jumlah: item.jumlah,
                harga_satuan: item.harga_satuan,
                nama_produk: item.produk.nama_produk,
            })),
            totalBelanja: totalHarga,
            shippingCost: shippingCost,
            grandTotal: grandTotal,
            selectedCourier: selectedCourier,
            selectedService: selectedService,
            customerName: customerName,
            customerPhone: customerPhone,
            customerAddress: customerAddress,
            selectedProvinceId: selectedProvince,
            selectedProvinceName: selectedProvinceObj ? selectedProvinceObj.province : '',
            selectedCityId: selectedCity,
            selectedCityName: selectedCityObj ? `${selectedCityObj.type} ${selectedCityObj.city_name}` : '',
            selectedDistrict: selectedDistrict,
            customerPostalCode: customerPostalCode,
            customerNotes: customerNotes,
        };

        try {
            const response = await fetch(route('transaksi.store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || ''
                },
                body: JSON.stringify(orderPayload),
            });

            const responseData = await response.json();

            if (!response.ok) {
                if (responseData.errors) {
                    Object.values(responseData.errors).forEach((errorArray: any) => {
                        errorArray.forEach((errorMessage: string) => {
                            toast.error(errorMessage);
                        });
                    });
                } else {
                    toast.error(responseData.message || 'Gagal membuat transaksi.');
                }
                setIsLoading(false);
                return;
            }

            const snapToken = responseData.snap_token;
            if (snapToken) {
                window.snap.pay(snapToken, {
                    onSuccess: function (result: any) {
                        toast.success('Pembayaran berhasil!');
                        console.log(result);
                        router.visit(route('pelanggan.transaksi.finish') + `?order_id=${result.order_id}&status_code=${result.status_code}&transaction_status=${result.transaction_status}`);
                    },
                    onPending: function (result: any) {
                        toast.info('Menunggu pembayaran Anda...');
                        console.log(result);
                        router.visit(route('pelanggan.transaksi.finish') + `?order_id=${result.order_id}&status_code=${result.status_code}&transaction_status=${result.transaction_status}`);
                    },
                    onError: function (result: any) {
                        toast.error('Pembayaran gagal!');
                        console.log(result);
                        setIsLoading(false);
                    },
                    onClose: function () {
                        toast.info('Anda menutup popup tanpa menyelesaikan pembayaran.');
                        setIsLoading(false);
                    }
                });
            } else {
                toast.error('Token pembayaran tidak diterima dari server.');
                setIsLoading(false);
            }

        } catch (error: any) {
            toast.error('Terjadi kesalahan: ' + error.message);
            console.error("Submit order error:", error);
            setIsLoading(false);
        }
    };

    return (
        <AppTopbarLayout
            breadcrumbs={[
                { title: 'Beranda', href: route('pelanggan.dashboard') },
                { title: 'Keranjang', href: route('pelanggan.keranjang.index') },
                { title: 'Checkout', href: '#' }
            ]}
        >
            <Head title="Checkout">
                <script src="https://app.sandbox.midtrans.com/snap/snap.js" data-client-key="YOUR_MIDTRANS_CLIENT_KEY_PLACEHOLDER"></script>
            </Head>
            <div className="container mx-auto px-4 py-8">
                <Link href={route('pelanggan.keranjang.index')} className="flex items-center text-sm text-gray-600 hover:text-gray-800 mb-4">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Kembali ke Keranjang
                </Link>
                <h1 className="text-2xl font-semibold mb-6">Checkout</h1>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-7 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Alamat Pengiriman</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">Nama Penerima</label>
                                    <input type="text" id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label>
                                    <input type="text" id="customerPhone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="customerAddress" className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
                                    <textarea id="customerAddress" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} rows={3} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                                </div>
                                <div>
                                    <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1">Provinsi</label>
                                    <select
                                        id="province"
                                        value={selectedProvince}
                                        onChange={(e) => handleProvinceChange(e.target.value)}
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        disabled={isLoadingProvinces}
                                    >
                                        <option value="">{isLoadingProvinces ? 'Memuat...' : 'Pilih Provinsi'}</option>
                                        {provinces.map((province) => (
                                            <option key={province.province_id} value={province.province_id}>
                                                {province.province}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">Kota/Kabupaten</label>
                                    <select
                                        id="city"
                                        value={selectedCity}
                                        onChange={(e) => handleCityChange(e.target.value)}
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        disabled={!selectedProvince || isLoadingCities}
                                    >
                                        <option value="">{isLoadingCities ? 'Memuat...' : 'Pilih Kota/Kabupaten'}</option>
                                        {cities.map((city) => (
                                            <option key={city.city_id} value={city.city_id}>
                                                {city.type} {city.city_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                 <div>
                                    <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">Kecamatan</label>
                                    <input type="text" id="district" value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} placeholder="Masukkan kecamatan jika perlu" className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">Kode Pos</label>
                                    <Input id="kode_pos" value={customerPostalCode} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerPostalCode(e.target.value)} placeholder="Kode Pos" />
                                </div>
                                <div>
                                    <Label htmlFor="customerNotes">Catatan (Opsional)</Label>
                                    <Textarea
                                        id="customerNotes"
                                        value={customerNotes}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCustomerNotes(e.target.value)}
                                        placeholder="Misalnya: warna, ukuran, atau permintaan khusus lainnya."
                                        className="mt-1"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>Opsi Pengiriman</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label htmlFor="courier" className="block text-sm font-medium text-gray-700 mb-1">Pilih Kurir</label>
                                    <select
                                        id="courier"
                                        value={selectedCourier}
                                        onChange={(e) => handleCourierChange(e.target.value)}
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        disabled={!selectedCity || isLoadingShipping}
                                    >
                                        <option value="">Pilih Kurir</option>
                                        <option value="jne">JNE</option>
                                        <option value="pos">POS Indonesia</option>
                                        <option value="tiki">TIKI</option>
                                    </select>
                                </div>
                                {(isLoadingShipping) && <p className="text-sm text-gray-500 flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memuat layanan...</p>}
                                {availableServices.length > 0 && !isLoadingShipping && (
                                    <div>
                                        <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-1">Pilih Layanan</label>
                                        <select
                                            id="service"
                                            value={selectedService}
                                            onChange={(e) => handleServiceChange(e.target.value)}
                                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        >
                                            <option value="">Pilih Layanan</option>
                                            {availableServices.map((service) => (
                                                <option key={service.service} value={service.service}>
                                                    {service.description} ({formatRupiah(service.cost[0].value)}) - Estimasi {service.cost[0].etd}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                {shippingCost > 0 && !isLoadingShipping && (
                                     <p className="text-sm text-gray-600">Biaya Ongkir Terpilih: {formatRupiah(shippingCost)}</p>
                                )}
                                 {availableServices.length === 0 && !isLoadingShipping && selectedCourier && selectedCity && (
                                    <p className="text-sm text-yellow-600">Tidak ada layanan yang tersedia untuk kurir dan tujuan ini.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-5">
                        <Card className="sticky top-24">
                            <CardHeader><CardTitle>Ringkasan Transaksi</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {checkoutItems.map((item: CheckoutItem) => (
                                        <div key={item.id_keranjang} className="flex justify-between items-center text-sm">
                                            <div>
                                                <p className="font-medium">{item.produk.nama_produk} <span className="text-xs text-gray-500">x{item.jumlah}</span></p>
                                                <p className="text-xs text-gray-500">Berat: {item.produk.berat * item.jumlah} gr</p>
                                            </div>
                                            <p>{formatRupiah(item.subtotal)}</p>
                                        </div>
                                    ))}
                                </div>
                                <Separator className="my-4" />
                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <p>Subtotal Produk</p>
                                        <p>{formatRupiah(totalHarga)}</p>
                                    </div>
                                     <div className="flex justify-between text-sm">
                                        <p>Total Berat</p>
                                        <p>{(totalBerat / 1000).toFixed(2)} kg</p>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <p>Biaya Pengiriman</p>
                                        <p>{shippingCost > 0 ? formatRupiah(shippingCost) : '-'}</p>
                                    </div>
                                    <Separator className="my-2" />
                                    <div className="flex justify-between font-semibold text-lg">
                                        <p>Total Pembayaran</p>
                                        <p>{formatRupiah(grandTotal)}</p>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className="w-full"
                                    onClick={handleSubmitOrder}
                                    disabled={isLoading || isLoadingProvinces || isLoadingCities || isLoadingShipping || shippingCost === 0 || !selectedService || !customerName || !customerPhone || !customerAddress || !selectedCity}
                                >
                                    {(isLoading || isLoadingProvinces || isLoadingCities || isLoadingShipping) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Lanjutkan ke Pembayaran
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        </AppTopbarLayout>
    );
}
