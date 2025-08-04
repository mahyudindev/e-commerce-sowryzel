<?php

namespace App\Http\Controllers;

use App\Models\Transaksi;
use App\Models\DetailTransaksi;
use App\Models\Produk;
use App\Models\Pelanggan;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Midtrans\Config as MidtransConfig;
use Midtrans\Snap as MidtransSnap;
use App\Models\Keranjang;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;
use App\Models\Ulasan;
use Illuminate\Validation\Rule;
use Barryvdh\DomPDF\Facade\Pdf;

class TransaksiController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        if (!$user || !$user->pelanggan) {
            // Jika user tidak memiliki profil pelanggan, kembalikan array kosong atau handle error
            return Inertia::render('pelanggan/transaksi/index', [
                'transaksis' => [],
                'activeTab' => request()->input('tab', 'semua')
            ]);
        }
        $pelanggan = $user->pelanggan;

        $transaksis = Transaksi::with(['detailTransaksis.produk.gambar', 'detailTransaksis.produk.ulasan'])
            ->where('pelanggan_id', $pelanggan->pelanggan_id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($transaksi) use ($user) {
                Log::info('Transaksi Model from DB:', $transaksi->toArray()); // Log entire model
                Log::info('Transaksi ID from model (using ->transaksi_id): ' . $transaksi->transaksi_id);
                $mappedData = [
                    'id_transaksi' => $transaksi->transaksi_id, // Gunakan field transaksi_id dari model
                    'invoice_id' => $transaksi->invoice_id,
                    'tanggal_transaksi' => $transaksi->created_at,
                    'total_keseluruhan' => $transaksi->total_keseluruhan,
                    'status_pembayaran' => $transaksi->status_pembayaran,
                    'status_transaksi' => $transaksi->status_transaksi,
                    'metode_pembayaran' => $transaksi->metode_pembayaran,
                    'snap_token' => $transaksi->snap_token,
                    'snap_redirect_url' => $transaksi->snap_redirect_url, // Pastikan ini ada di model Transaksi jika digunakan
                    'nomor_resi' => $transaksi->nomor_resi, // Tambahkan nomor resi
                    'detail_transaksi' => $transaksi->detailTransaksis->map(function ($item) use ($user) {
                        return [
                            'id_detail_transaksi' => $item->detail_transaksi_id,
                            'jumlah' => $item->jumlah,
                            'harga_satuan' => $item->harga_satuan,
                            'subtotal' => $item->subtotal,
                            'produk' => [
                                'produk_id' => $item->produk->produk_id,
                                'nama_produk' => $item->produk->nama_produk,
                                'gambar' => $item->produk->gambar->map(function ($g) {
                                    return ['url' => Storage::url($g->path)]; // Asumsi path disimpan dan perlu URL
                                })->take(1),
                            ],
                            'ulasan_exists' => Ulasan::where('detail_transaksi_id', $item->detail_transaksi_id)->exists(),
                            'ulasan' => Ulasan::where('detail_transaksi_id', $item->detail_transaksi_id)
                                ->select('rating', 'komentar', 'created_at')
                                ->first(),
                        ];
                    }),
                ];
                Log::info('Mapped Transaksi data for frontend:', $mappedData);
                return $mappedData;
            });

        return Inertia::render('pelanggan/transaksi/index', [
            'transaksis' => $transaksis,
            'activeTab' => request()->input('tab', 'semua')
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'items' => 'required|array|min:1',
            'items.*.produk_id' => 'required|integer|exists:produk,produk_id',
            'items.*.jumlah' => 'required|integer|min:1',
            'items.*.harga_satuan' => 'required|numeric',
            'items.*.nama_produk' => 'required|string',
            'items.*.keranjang_id' => 'nullable|integer', // ID item keranjang jika berasal dari keranjang
            'totalBelanja' => 'required|numeric|min:0',
            'shippingCost' => 'required|numeric|min:0',
            'grandTotal' => 'required|numeric|min:0',
            'selectedCourier' => 'required|string',
            'selectedService' => 'required|string',
            'customerName' => 'required|string|max:255',
            'customerPhone' => 'required|string|max:20',
            'customerAddress' => 'required|string',
            'selectedProvinceId' => 'required|string',
            'selectedProvinceName' => 'required|string',
            'selectedCityId' => 'required|string',
            'selectedCityName' => 'required|string',
            'selectedDistrict' => 'nullable|string',
            'customerPostalCode' => 'required|string|max:10',
            'customerNotes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = Auth::user();
        if (!$user || !$user->pelanggan) {
            return response()->json(['message' => 'Pelanggan tidak ditemukan.'], 403);
        }
        $pelanggan = $user->pelanggan;

        DB::beginTransaction();

        try {
            $invoiceId = 'INV-' . strtoupper(Str::random(4)) . '-' . date('YmdHis');

            $alamatPengiriman = [
                'nama_penerima' => $request->customerName,
                'no_telepon' => $request->customerPhone,
                'alamat_lengkap' => $request->customerAddress,
                'provinsi_id' => $request->selectedProvinceId,
                'provinsi_nama' => $request->selectedProvinceName,
                'kota_id' => $request->selectedCityId,
                'kota_nama' => $request->selectedCityName,
                'kecamatan' => $request->selectedDistrict,
                'kode_pos' => $request->customerPostalCode,
                'kurir' => $request->selectedCourier,
                'layanan_kurir' => $request->selectedService,
            ];

            $transaksi = Transaksi::create([
                'pelanggan_id' => $pelanggan->pelanggan_id,
                'invoice_id' => $invoiceId,
                'total_belanja' => $request->totalBelanja,
                'biaya_pengiriman' => $request->shippingCost,
                'total_keseluruhan' => $request->grandTotal,
                'status_transaksi' => 'pending',
                'status_pembayaran' => 'unpaid',
                'alamat_pengiriman_json' => json_encode($alamatPengiriman),
                'catatan_pelanggan' => $request->customerNotes,
            ]);

            $midtransItemDetails = [];
            $calculated_total_berat = 0; // Initialize total weight
            foreach ($request->items as $item) {
                $produk = Produk::find($item['produk_id']);
                if (!$produk) {
                    DB::rollBack();
                    return response()->json(['message' => 'Produk ' . $item['nama_produk'] . ' tidak ditemukan.'], 404);
                }
                if ($produk->stok < $item['jumlah']) {
                    DB::rollBack();
                    return response()->json(['message' => 'Stok produk ' . $produk->nama_produk . ' tidak mencukupi.'], 400);
                }

                DetailTransaksi::create([
                    'transaksi_id' => $transaksi->transaksi_id,
                    'produk_id' => $item['produk_id'],
                    'nama_produk' => $item['nama_produk'], 
                    'jumlah' => $item['jumlah'],
                    'harga_satuan' => $item['harga_satuan'],
                    'subtotal' => $item['jumlah'] * $item['harga_satuan'],
                ]);

                $produk->decrement('stok', $item['jumlah']);

                // Calculate weight for this item and add to total
                Log::info('Processing weight for Produk ID: ' . $produk->produk_id . ' | Item: ', $item);
                Log::info('Produk->berat value: ' . ($produk->berat ?? 'NULL') . ' | Type: ' . gettype($produk->berat));
                Log::info('Item jumlah: ' . $item['jumlah'] . ' | Type: ' . gettype($item['jumlah']));

                if (isset($produk->berat) && is_numeric($produk->berat) && is_numeric($item['jumlah'])) {
                    $item_weight = $produk->berat * $item['jumlah'];
                    $calculated_total_berat += $item_weight;
                    Log::info('Calculated item_weight: ' . $item_weight . ' | Cumulative calculated_total_berat: ' . $calculated_total_berat);
                } else {
                    Log::warning('Skipping weight calculation for Produk ID: ' . $produk->produk_id . '. Berat or jumlah is not set or not numeric.');
                }

                $midtransItemDetails[] = [
                    'id' => $item['produk_id'],
                    'price' => (int)$item['harga_satuan'],
                    'quantity' => (int)$item['jumlah'],
                    'name' => Str::limit($item['nama_produk'], 50),
                ];
            }

            if ($request->shippingCost > 0) {
                $midtransItemDetails[] = [
                    'id' => 'SHIPPING_COST',
                    'price' => (int)$request->shippingCost,
                    'quantity' => 1,
                    'name' => 'Biaya Pengiriman',
                ];
            }

            MidtransConfig::$serverKey = config('midtrans.server_key');
            MidtransConfig::$isProduction = config('midtrans.is_production');
            MidtransConfig::$isSanitized = config('midtrans.is_sanitized');
            MidtransConfig::$is3ds = config('midtrans.is_3ds');

            $midtransParams = [
                'transaction_details' => [
                    'order_id' => $invoiceId,
                    'gross_amount' => (int)$request->grandTotal,
                ],
                'item_details' => $midtransItemDetails,
                'customer_details' => [
                    'first_name' => $pelanggan->nama_lengkap, 
                    'email' => $user->email,
                    'phone' => $pelanggan->no_telepon,
                    'billing_address' => [
                        'first_name' => $pelanggan->nama_lengkap,
                        'phone' => $pelanggan->no_telepon,
                        'address' => $pelanggan->alamat, // Alamat utama pelanggan
                        'city' => $pelanggan->kota ?? $request->selectedCityName, // Fallback jika tidak ada
                        'postal_code' => $pelanggan->kode_pos ?? $request->customerPostalCode, // Fallback
                        'country_code' => 'IDN',
                    ],
                    'shipping_address' => [
                        'first_name' => $request->customerName,
                        'phone' => $request->customerPhone,
                        'address' => $request->customerAddress,
                        'city' => $request->selectedCityName,
                        'postal_code' => $request->customerPostalCode,
                        'country_code' => 'IDN',
                    ],
                ],
                'callbacks' => [
                    'finish' => route('pelanggan.transaksi.finish')
                ]
            ];

            Log::info('Midtrans params before getSnapToken: ', $midtransParams);

            // Save the calculated total weight to the transaction
            $transaksi->total_berat = $calculated_total_berat;

            $snapToken = \Midtrans\Snap::getSnapToken($midtransParams);
            $transaksi->snap_token = $snapToken;
            $transaksi->save();

            // Hapus item dari keranjang setelah transaksi berhasil
            $keranjangIdsToDelete = [];
            if ($request->has('items')) {
                foreach ($request->items as $reqItem) {
                    if (isset($reqItem['keranjang_id']) && !empty($reqItem['keranjang_id'])) {
                        $keranjangIdsToDelete[] = $reqItem['keranjang_id'];
                    }
                }
            }

            if (!empty($keranjangIdsToDelete)) {
                // Pastikan $pelanggan sudah terdefinisi dan bukan null
                if ($pelanggan) {
                    Keranjang::where('user_id', Auth::id()) // Use user_id and Auth::id()
                            ->whereIn('id_keranjang', $keranjangIdsToDelete) // Match primary key column name
                            ->delete();
                    Log::info('Cart items deleted for pelanggan_id: ' . $pelanggan->pelanggan_id . ', keranjang_ids: ' . implode(',', $keranjangIdsToDelete));
                } else {
                    Log::warning('Attempted to delete cart items but $pelanggan is null during transaction store.');
                }
            }

            DB::commit();

            return response()->json(['snap_token' => $snapToken]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Order creation failed: ' . $e->getMessage() . "\nStack Trace:\n" . $e->getTraceAsString());
            return response()->json(['message' => 'Gagal membuat transaksi. Silakan coba lagi.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Transaksi $transaksi)
    {
        if (Auth::id() !== optional($transaksi->pelanggan)->user_id) { // Basic authorization
            abort(403, 'Unauthorized action.');
        }

        $transaksi->load(['detailTransaksis.produk.gambar', 'pelanggan.user']);

        $formattedTransaksi = [
            'transaksi_id' => $transaksi->transaksi_id,
            'invoice_id' => $transaksi->invoice_id,
            'tanggal_transaksi' => $transaksi->created_at,
            'total_belanja' => $transaksi->total_belanja,
            'biaya_pengiriman' => $transaksi->biaya_pengiriman,
            'total_keseluruhan' => $transaksi->total_keseluruhan,
            'status_pembayaran' => $transaksi->status_pembayaran,
            'status_transaksi' => $transaksi->status_transaksi,
            'metode_pembayaran' => $transaksi->metode_pembayaran,
            'snap_token' => $transaksi->snap_token,
            'snap_redirect_url' => $transaksi->snap_redirect_url,
            'alamat_pengiriman_json' => json_decode($transaksi->alamat_pengiriman_json, true),
            'catatan_pelanggan' => $transaksi->catatan_pelanggan,
            'stock_reverted_at' => $transaksi->stock_reverted_at,
            'pelanggan' => $transaksi->pelanggan ? [
                'nama_pelanggan' => optional($transaksi->pelanggan->user)->name,
                'email' => optional($transaksi->pelanggan->user)->email,
                'no_hp' => $transaksi->pelanggan->no_hp,
            ] : null,
            'detail_transaksi' => $transaksi->detailTransaksis->map(function ($item) {
                return [
                    'detail_transaksi_id' => $item->detail_transaksi_id,
                    'jumlah' => $item->jumlah,
                    'harga_satuan' => $item->harga_satuan,
                    'subtotal' => $item->subtotal,
                    'produk' => $item->produk ? [
                        'produk_id' => $item->produk->produk_id,
                        'nama_produk' => $item->produk->nama_produk,
                        'gambar' => $item->produk->gambar->map(function ($g) {
                            return ['url' => Storage::url($g->path)];
                        })->first(),
                    ] : null,
                ];
            }),
            'created_at' => $transaksi->created_at,
            'updated_at' => $transaksi->updated_at,
        ];

        return Inertia::render('pelanggan/transaksi/show', [
            'transaksi' => $formattedTransaksi,
        ]);
    }

    public function finish(Request $request)
    {
        Log::info('Midtrans finish callback query params: ', $request->query());
        $orderId = $request->query('order_id');
        $statusCode = $request->query('status_code');
        $transactionStatus = $request->query('transaction_status');

        $transaksi = Transaksi::where('invoice_id', $orderId)->first();

        if (!$transaksi) {
            Log::warning("Midtrans finish callback: Transaksi dengan invoice_id {$orderId} tidak ditemukan.");
            return redirect()->route('pelanggan.dashboard')->with('error', 'Transaksi tidak ditemukan.');
        }

        $flashData = [
            'order_id' => $orderId,
            'payment_status_code' => $statusCode,
            'payment_transaction_status' => $transactionStatus,
        ];

        switch ($transactionStatus) {
            case 'capture':
            case 'settlement':
                Log::info("Finish - Settlement: Current status_pembayaran for {$orderId}: " . $transaksi->status_pembayaran);
                if ($transaksi->status_pembayaran !== 'paid') {
                    Log::info("Finish - Settlement: Updating status_pembayaran to 'paid' for {$orderId}.");
                    $transaksi->status_pembayaran = 'paid';
                    $transaksi->status_transaksi = 'pending'; // Changed from 'processing'
                    Log::info("Finish - Settlement: status_pembayaran after update for {$orderId}: " . $transaksi->status_pembayaran . ", status_transaksi: " . $transaksi->status_transaksi);
                } else {
                    Log::info("Finish - Settlement: status_pembayaran for {$orderId} is already 'paid'. No update needed.");
                }
                $flashData['message_type'] = 'success';
                $flashData['message'] = 'Pembayaran untuk transaksi ' . $orderId . ' telah berhasil.';
                break;
            case 'pending':
                if ($transaksi->status_pembayaran === 'unpaid') {
                    $transaksi->status_pembayaran = 'pending';
                }
                $flashData['message_type'] = 'info';
                $flashData['message'] = 'Transaksi ' . $orderId . ' menunggu pembayaran. Silakan selesaikan pembayaran Anda.';
                break;
            case 'deny':
                $transaksi->status_pembayaran = 'failed';
                $transaksi->status_transaksi = 'batal';
                $flashData['message_type'] = 'error';
                $flashData['message'] = 'Pembayaran untuk transaksi ' . $orderId . ' ditolak.';
                break;
            case 'cancel':
                $transaksi->status_pembayaran = 'failed'; // Match ENUM
                $transaksi->status_transaksi = 'batal';
                $flashData['message_type'] = 'warning';
                $flashData['message'] = 'Pembayaran untuk transaksi ' . $orderId . ' dibatalkan.';
                break;
            case 'expire':
                $transaksi->status_pembayaran = 'expired';
                $transaksi->status_transaksi = 'batal'; // Or 'expired_payment'
                $flashData['message_type'] = 'warning';
                $flashData['message'] = 'Waktu pembayaran untuk transaksi ' . $orderId . ' telah habis.';
                break;
            default:
                $flashData['message_type'] = 'info';
                $flashData['message'] = 'Status pembayaran untuk transaksi ' . $orderId . ': ' . $transactionStatus . '.';
                break;
        }
        Log::info("Finish - Before save for {$orderId}: status_pembayaran=" . $transaksi->status_pembayaran . ", status_transaksi=" . $transaksi->status_transaksi);
        $transaksi->save();
        Log::info("Finish - After save for {$orderId}: Transaction saved.");

        return redirect()->route('pelanggan.dashboard')->with($flashData);
    }

    public function notificationHandler(Request $request)
    {
        MidtransConfig::$serverKey = config('midtrans.server_key');
        MidtransConfig::$isProduction = config('midtrans.is_production');
        // MidtransConfig::$isSanitized = config('midtrans.is_sanitized'); // Uncomment if you use this
        // MidtransConfig::$is3ds = config('midtrans.is_3ds'); // Uncomment if you use this

        $payload = $request->getContent();
        Log::info('Midtrans Notification Raw Payload: ' . $payload);

        $notif = json_decode($payload);

        if (json_last_error() !== JSON_ERROR_NONE) {
            Log::error('Midtrans Notification Error: Invalid JSON payload received. Error: ' . json_last_error_msg());
            return response('Invalid JSON payload.', 400); // Bad Request
        }

        // Basic validation that $notif is an object and has required properties
        if (!is_object($notif) || 
            !isset($notif->order_id, $notif->transaction_status, $notif->payment_type, 
                  $notif->signature_key, $notif->status_code, $notif->gross_amount)) {
            Log::error('Midtrans Notification Error: Incomplete notification object. Payload: ' . $payload);
            return response('Incomplete notification data.', 400); // Bad Request
        }

        // Proceed with your existing logic, using the decoded $notif
        $transaction = $notif->transaction_status;
        $type = $notif->payment_type;
        $order_id = $notif->order_id;
        $fraud = $notif->fraud_status ?? null; // Use null coalescing if fraud_status might not always be present

        Log::info("Midtrans Notification Parsed for Order ID: {$order_id}, Transaction Status: {$transaction}, Payment Type: {$type}, Fraud Status: {$fraud}");

        // Check if this is a retry payment by looking for the RETRY suffix in order_id
        if (strpos($order_id, '-RETRY-') !== false) {
            // Extract the original invoice_id from the retry order_id
            $original_invoice_id = substr($order_id, 0, strpos($order_id, '-RETRY-'));
            Log::info("Midtrans notification: Detected retry payment. Original invoice_id: {$original_invoice_id}");
            
            // Find transaction using the original invoice_id
            $transaksi = Transaksi::where('invoice_id', $original_invoice_id)->first();
        } else {
            // Regular transaction lookup
            $transaksi = Transaksi::where('invoice_id', $order_id)->first();
        }

        if (!$transaksi) {
            Log::warning("Midtrans notification: Transaksi dengan invoice_id {$order_id} tidak ditemukan.");
            return response('Order not found.', 404);
        }

        $local_signature_key = hash('sha512', $notif->order_id . $notif->status_code . $notif->gross_amount . config('midtrans.server_key'));
        if ($notif->signature_key !== $local_signature_key) {
            Log::error("Midtrans notification: Invalid signature for order_id {$order_id}. Expected: {$local_signature_key}, Got: {$notif->signature_key}");
            return response('Invalid signature.', 403);
        }

        if (empty($transaksi->midtrans_transaction_id) && isset($notif->transaction_id)) {
            $transaksi->midtrans_transaction_id = $notif->transaction_id;
        }

        if ($transaction == 'capture') {
            if ($type == 'credit_card') {
                if ($fraud == 'challenge') {
                    $transaksi->status_pembayaran = 'unpaid'; // Match ENUM, fraud is 'challenge'
                    $transaksi->status_transaksi = 'pending'; // Was pending_verification, map to pending 
                } else {
                    $transaksi->status_pembayaran = 'paid';
                    $transaksi->status_transaksi = 'pending'; // Changed from 'processing'
                }
            }
        } elseif ($transaction == 'settlement') {
            if ($transaksi->status_pembayaran !== 'paid' || $transaksi->status_transaksi !== 'pending') { // Check both to avoid redundant writes and ensure correct status
                $transaksi->status_pembayaran = 'paid';
                $transaksi->status_transaksi = 'pending'; // Changed from 'processing'
            }
        } elseif ($transaction == 'pending') {
            if ($transaksi->status_pembayaran === 'unpaid') {
                $transaksi->status_pembayaran = 'unpaid'; // Match ENUM, Midtrans status is 'pending'
            }
        } elseif ($transaction == 'deny') {
            $transaksi->status_pembayaran = 'denied';
            $transaksi->status_transaksi = 'batal';
            $this->revertStock($transaksi);
        } elseif ($transaction == 'expire') {
            $transaksi->status_pembayaran = 'expired';
            $transaksi->status_transaksi = 'batal';
            $this->revertStock($transaksi);
        } elseif ($transaction == 'cancel') {
            $transaksi->status_pembayaran = 'cancelled';
            $transaksi->status_transaksi = 'batal';
            $this->revertStock($transaksi);
        }

        if (isset($notif->payment_type)) {
            $transaksi->metode_pembayaran = $notif->payment_type;
            Log::info("Midtrans notification: Updating metode_pembayaran for order_id {$order_id} to {$notif->payment_type}");
        }

        try {
            $transaksi->save();
            Log::info("Status transaksi {$order_id} berhasil diperbarui menjadi {$transaksi->status_pembayaran} / {$transaksi->status_transaksi}");
        } catch (\Exception $e) {
            Log::error("Gagal menyimpan status transaksi {$order_id}: " . $e->getMessage());
            return response('Error updating order status.', 500);
        }

        return response('OK', 200); 
    }

    private function revertStock(Transaksi $transaksi)
    {
        if ($transaksi->stock_reverted_at || !in_array($transaksi->status_transaksi, ['cancelled', 'failed', 'expired'])) {
            if($transaksi->stock_reverted_at){
                Log::info("Stock for order {$transaksi->invoice_id} already reverted on {$transaksi->stock_reverted_at}.");
            } else {
                Log::info("Stock reversion not applicable for order {$transaksi->invoice_id} with status {$transaksi->status_transaksi}.");
            }
            return;
        }

        foreach ($transaksi->detailTransaksis as $detail) {
            $produk = Produk::find($detail->produk_id);
            if ($produk) {
                $produk->increment('stok', $detail->jumlah);
                Log::info("Stock for produk_id {$detail->produk_id} incremented by {$detail->jumlah} for order {$transaksi->invoice_id}.");
            }
        }

        $transaksi->stock_reverted_at = now();
        $transaksi->save(); // Save the timestamp
        Log::info("Stock reversion completed for order {$transaksi->invoice_id}.");
    }
    public function adminIndex(Request $request)
    {
        $perPage = $request->input('per_page', 10);

        $query = Transaksi::with(['pelanggan.user'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('invoice_id', 'like', '%' . $searchTerm . '%')
                  ->orWhereHas('pelanggan', function ($pelangganQuery) use ($searchTerm) {
                      $pelangganQuery->where('nama_lengkap', 'like', '%' . $searchTerm . '%')
                                   ->orWhereHas('user', function($userQuery) use ($searchTerm) {
                                       $userQuery->where('email', 'like', '%' . $searchTerm . '%');
                                   });
                  });
            });
        }

        if ($request->filled('status_transaksi') && $request->status_transaksi !== 'all') {
            $query->where('status_transaksi', $request->status_transaksi);
        }

        if ($request->filled('status_pembayaran') && $request->status_pembayaran !== 'all') {
            $query->where('status_pembayaran', $request->status_pembayaran);
        }

        $transaksis = $query->paginate($perPage)->withQueryString();

        $formattedTransaksis = $transaksis->through(function ($transaksi) {
        // Enhanced Logging for adminIndex
        $logIdTransaksiProperty = $transaksi->id_transaksi ?? 'NULL_PROPERTY';
        $logGetKey = $transaksi->getKey() ?? 'NULL_GETKEY';
        $logGetAttribute = $transaksi->getAttribute('transaksi_id') ?? 'NULL_GETATTRIBUTE';
        \Illuminate\Support\Facades\Log::info("[AdminIndex] Invoice: " . ($transaksi->invoice_id ?? 'N/A') . ", id_transaksi property: {$logIdTransaksiProperty}, getKey(): {$logGetKey}, getAttribute('transaksi_id'): {$logGetAttribute}");
        if (is_null($transaksi->getKey())) { // Check getKey() for warning
            \Illuminate\Support\Facades\Log::warning('[AdminIndex] NULL primary key (getKey) for Invoice ID: ' . ($transaksi->invoice_id ?? 'N/A') . '. Transaksi Object: ' . json_encode($transaksi->toArray()));
        }
        return [
                'id_transaksi' => $transaksi->getKey(),
                'invoice_id' => $transaksi->invoice_id,
                'pelanggan' => $transaksi->pelanggan ? [
                    'id' => $transaksi->pelanggan->pelanggan_id,
                    'nama_lengkap' => $transaksi->pelanggan->nama_lengkap,
                    'no_telepon' => $transaksi->pelanggan->no_telepon,
                    'email' => $transaksi->pelanggan->user->email ?? null,
                ] : null,
                'tanggal_transaksi' => $transaksi->created_at->toIso8601String(),
                'total_keseluruhan' => (float) $transaksi->total_keseluruhan,
                'status_pembayaran' => $transaksi->status_pembayaran,
                'status_transaksi' => $transaksi->status_transaksi,
            ];
        });

        return Inertia::render('admin/transaksi/index', [
            'transaksi' => $formattedTransaksis,
            'filters' => $request->only(['search', 'status_transaksi', 'status_pembayaran', 'per_page']),
            'statusTransaksiOptions' => array_keys(Transaksi::STATUS_TRANSAKSI_OPTIONS),
            'statusPembayaranOptions' => array_keys(Transaksi::STATUS_PEMBAYARAN_OPTIONS),
        ]);
    }

public function adminShow(Transaksi $transaksi)
    {
        $transaksi->load(['pelanggan.user', 'detailTransaksis.produk.gambar' => function ($query) {
            $query->orderBy('urutan', 'asc');
        }]);

    $alamatPengiriman = json_decode($transaksi->alamat_pengiriman_json, true);

    $formattedTransaksi = [
        'id_transaksi' => $transaksi->transaksi_id, // Corrected to use primary key name
        'invoice_id' => $transaksi->invoice_id,
        'tanggal_transaksi' => $transaksi->created_at->isoFormat('D MMM YYYY, HH:mm'),
        'status_transaksi' => $transaksi->status_transaksi,
        'status_pembayaran' => $transaksi->status_pembayaran,
        'metode_pembayaran' => $transaksi->metode_pembayaran,
        'total_belanja' => (float) $transaksi->total_belanja,
        'biaya_pengiriman' => (float) $transaksi->biaya_pengiriman,
        'total_keseluruhan' => (float) $transaksi->total_keseluruhan,
        'catatan_pelanggan' => $transaksi->catatan_pelanggan,
        'nomor_resi' => $transaksi->nomor_resi,
        'pelanggan' => $transaksi->pelanggan ? [
            'nama_lengkap' => $transaksi->pelanggan->nama_lengkap,
            'email' => $transaksi->pelanggan->user->email ?? null,
            'nomor_telepon' => $transaksi->pelanggan->no_telepon,
        ] : null,
        'alamat_pengiriman' => $alamatPengiriman,
        'detail_transaksis' => $transaksi->detailTransaksis->map(function ($item) {
            return [
                'id_detail_transaksi' => $item->id_detail_transaksi,
                'nama_produk' => $item->nama_produk,
                'jumlah' => (int) $item->jumlah,
                'harga_satuan' => (float) $item->harga_satuan,
                'subtotal' => (float) $item->subtotal,
                'produk' => $item->produk ? [
                    'kode_produk' => $item->produk->kode_produk,
                    'gambar_thumbnail' => $item->produk->gambar && $item->produk->gambar->first() ? \Illuminate\Support\Facades\Storage::url($item->produk->gambar->first()->path) : null,
                ] : null,
            ];
        }),
    ];

    $currentStatus = $transaksi->status_transaksi;
    $allowedNextStatuses = Transaksi::ALLOWED_TRANSITIONS[$currentStatus] ?? [];
    
    $statusOptions = [];
    if (!empty($allowedNextStatuses)) {
        foreach ($allowedNextStatuses as $statusValue) {
            if (isset(Transaksi::STATUS_TRANSAKSI_OPTIONS[$statusValue])) {
                $statusOptions[] = ['value' => $statusValue, 'label' => Transaksi::STATUS_TRANSAKSI_OPTIONS[$statusValue]];
            }
        }
    }
    // Always include the current status as an option, in case admin just wants to update resi without changing status
    // Or if there are no allowed next statuses (e.g., for 'batal' or 'selesai')
    if (!in_array($currentStatus, array_column($statusOptions, 'value'))) {
         $statusOptions[] = ['value' => $currentStatus, 'label' => Transaksi::STATUS_TRANSAKSI_OPTIONS[$currentStatus]];
         // Sort options to have current status first or based on typical flow
         // For simplicity, we can let the frontend handle the default selection.
    }


    return \Inertia\Inertia::render('admin/transaksi/show', [
        'transaksi' => $formattedTransaksi,
        'statusTransaksiOptions' => $statusOptions,
        'currentStatus' => $currentStatus // Pass current status for easier default selection in frontend
    ]);
}



    public function updateStatus(Request $request, Transaksi $transaksi)
    {
        $validated = $request->validate([
        'status_transaksi' => ['required', Rule::in(array_keys(Transaksi::STATUS_TRANSAKSI_OPTIONS))],
        'nomor_resi' => ['nullable', 'string', 'max:255', 'required_if:status_transaksi,dikirim']
    ]);

    $currentStatus = $transaksi->status_transaksi;
    $newStatus = $validated['status_transaksi'];

    if ($currentStatus === $newStatus) {
        // If status is not changing, just update resi if applicable and redirect
        if ($newStatus === 'dikirim' && array_key_exists('nomor_resi', $validated)) {
            $transaksi->nomor_resi = $validated['nomor_resi'];
            $transaksi->save();
            return redirect()->route('admin.transaksi.show', $transaksi)
                ->with('success', 'Nomor resi berhasil diperbarui.');
        }
        return redirect()->route('admin.transaksi.show', $transaksi)
            ->with('info', 'Status transaksi tidak berubah.');
    }

    $allowedTransitions = Transaksi::ALLOWED_TRANSITIONS[$currentStatus] ?? [];

    if (!in_array($newStatus, $allowedTransitions)) {
        return redirect()->route('admin.transaksi.show', $transaksi)
            ->with('error', "Perubahan status dari '{$currentStatus}' ke '{$newStatus}' tidak diizinkan.");
    }

    $transaksi->status_transaksi = $newStatus;

    if ($newStatus === 'dikirim') {
        if (empty($validated['nomor_resi'])) {
             return redirect()->route('admin.transaksi.show', $transaksi)
                ->with('error', 'Nomor resi wajib diisi jika status adalah dikirim.');
        }
        $transaksi->nomor_resi = $validated['nomor_resi'];
    } elseif ($currentStatus === 'dikirim' && $newStatus !== 'dikirim') {
        // Clear resi if status changes from 'dikirim' to something else
        $transaksi->nomor_resi = null;
    }

    $transaksi->save();

        return redirect()->route('admin.transaksi.show', $transaksi)
            ->with('success', 'Status transaksi dan nomor resi berhasil diperbarui.');
    }

// 
    // {
    //     //
    // }
    //
    // /**
    //  * Update the specified resource in storage.
    //  */
    // public function update(Request $request, Transaksi $transaksi)
    // {
    //     //
    // }
    //
    // /**
    //  * Remove the specified resource from storage.
    //  */
    // public function destroy(Transaksi $transaksi)
    // {

    public function downloadShippingLabelPdf(Transaksi $transaksi)
    {
        $transaksi->load(['pelanggan.user']);
    $alamatPengiriman = json_decode($transaksi->alamat_pengiriman_json, true);

    if (!$alamatPengiriman) {
        // Handle case where shipping address might be missing or not JSON
        \Illuminate\Support\Facades\Log::error('Alamat pengiriman JSON tidak valid atau kosong untuk transaksi ID: ' . $transaksi->getKey());
        return redirect()->back()->with('error', 'Data alamat pengiriman tidak lengkap untuk membuat label.');
    }

    // Attempt to clear any output buffers before PDF generation
    while (ob_get_level() > 0) {
        ob_end_clean();
    }

    $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('admin.transaksi.pdf_shipping_label', [
        'transaksi' => $transaksi,
        'alamatPengiriman' => $alamatPengiriman,
        'pelanggan' => $transaksi->pelanggan
    ]);

    return $pdf->download('shipping-label-' . $transaksi->invoice_id . '.pdf');
    }

    /**
     * Mark the specified transaction as 'selesai' by the customer.
     */
    public function markAsCompleted(Request $request, $transaksiId)
    {
        try {
            $user = $request->user();
            $pelanggan = $user->pelanggan;
            
            $transaksi = Transaksi::where('id_transaksi', $transaksiId)
                ->where('pelanggan_id', $pelanggan->pelanggan_id)
                ->first();
            
            if (!$transaksi) {
                return redirect()->back()
                ->with('error', 'Anda tidak diizinkan untuk mengubah status transaksi ini.');
            }
            
            if ($transaksi->status_transaksi !== 'dikirim') {
                return redirect()->back()
                ->with('error', 'Hanya transaksi yang sedang dikirim yang dapat ditandai sebagai selesai.');
            }
            
            $transaksi->status_transaksi = 'selesai';
            $transaksi->save();
            
            return redirect()->back()
            ->with('success', 'Transaksi berhasil ditandai sebagai selesai.');
        } catch (\Exception $e) {
            Log::error('Error in markAsCompleted: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Terjadi kesalahan saat memproses permintaan Anda.');
        }
    }
    
    /**
     * Retry payment for a pending transaction
     * 
     * @param Request $request
     * @param int $transaksi_id
     * @return \Illuminate\Http\RedirectResponse
     */
    public function retryPayment(Request $request, $transaksi_id)
    {
        try {
            // Log the start of the method
            Log::info('retryPayment method called for transaction ID: ' . $transaksi_id);
            
            $user = $request->user();
            if (!$user) {
                Log::error('No authenticated user found in retryPayment');
                return redirect()->route('login');
            }
            
            $pelanggan = $user->pelanggan;
            if (!$pelanggan) {
                Log::error('No pelanggan record found for user ID: ' . $user->id);
                return redirect()->back()->with('error', 'Data pelanggan tidak ditemukan.');
            }
            
            Log::info('User and pelanggan found', ['user_id' => $user->id, 'pelanggan_id' => $pelanggan->pelanggan_id]);
            
            // Find the transaction and make sure it belongs to this customer
            Log::info('Looking for transaction', ['transaksi_id' => $transaksi_id, 'pelanggan_id' => $pelanggan->pelanggan_id]);
            $transaksi = Transaksi::where('transaksi_id', $transaksi_id)
                ->where('pelanggan_id', $pelanggan->pelanggan_id)
                ->first();
            
            if (!$transaksi) {
                Log::error('Transaction not found', ['transaksi_id' => $transaksi_id, 'pelanggan_id' => $pelanggan->pelanggan_id]);
                return redirect()->back()
                    ->with('error', 'Transaksi tidak ditemukan.');
            }
            
            Log::info('Transaction found', ['transaksi_id' => $transaksi->transaksi_id, 'status_pembayaran' => $transaksi->status_pembayaran]);
            
            // Check if transaction is in a state where payment can be retried
            if ($transaksi->status_pembayaran !== 'unpaid' && $transaksi->status_pembayaran !== 'pending') {
                return redirect()->back()
                    ->with('error', 'Pembayaran hanya dapat diulang untuk transaksi dengan status pembayaran tertunda atau belum dibayar.');
            }
            
            // Set up Midtrans configuration
            Log::info('Setting up Midtrans configuration');
            try {
                $serverKey = config('services.midtrans.server_key');
                $isProduction = config('services.midtrans.is_production', false);
                
                if (empty($serverKey)) {
                    Log::error('Midtrans server key is empty');
                    return redirect()->back()->with('error', 'Konfigurasi Midtrans tidak valid. Hubungi administrator.');
                }
                
                Log::info('Midtrans config', ['server_key_exists' => !empty($serverKey), 'is_production' => $isProduction]);
                
                \Midtrans\Config::$serverKey = $serverKey;
                \Midtrans\Config::$isProduction = $isProduction;
                \Midtrans\Config::$isSanitized = true;
                \Midtrans\Config::$is3ds = true;
                
                // Generate a new unique order ID for retry payment
                $newOrderId = $transaksi->invoice_id . '-RETRY-' . date('YmdHis');
                Log::info('Creating Midtrans parameters', [
                    'original_invoice_id' => $transaksi->invoice_id,
                    'new_order_id' => $newOrderId,
                    'total_keseluruhan' => $transaksi->total_keseluruhan
                ]);
                
                $midtransParams = [
                    'transaction_details' => [
                        'order_id' => $newOrderId,
                        'gross_amount' => (int) $transaksi->total_keseluruhan,
                    ],
                    'customer_details' => [
                        'first_name' => $pelanggan->nama_depan,
                        'last_name' => $pelanggan->nama_belakang,
                        'email' => $user->email,
                        'phone' => $pelanggan->no_telepon,
                    ],
                    'callbacks' => [
                        'finish' => route('pelanggan.transaksi.index'),
                    ]
                ];/* */
                
                // Generate new snap token
                Log::info('Generating Midtrans snap token');
                $snapToken = \Midtrans\Snap::getSnapToken($midtransParams);
                Log::info('Snap token generated', ['token' => $snapToken]);
                
                $snapRedirectUrl = 'https://app.sandbox.midtrans.com/snap/v2/vtweb/' . $snapToken;
                // Update transaction with new token
                $transaksi->snap_token = $snapToken;
                $transaksi->save();
                Log::info('Transaction updated with new token');
                
                // Return JSON response with snap token for frontend modal
                Log::info('Returning snap token for frontend modal', ['token' => $snapToken]);
                return response()->json([
                    'success' => true,
                    'snap_token' => $snapToken
                ]);
            } catch (\Exception $e) {
                Log::error('Error in Midtrans setup: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
                return redirect()->back()->with('error', 'Terjadi kesalahan saat memproses pembayaran: ' . $e->getMessage());
            }
            
        } catch (\Exception $e) {
            Log::error('Error in retryPayment: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Terjadi kesalahan saat memproses pembayaran ulang: ' . $e->getMessage());
        }
    }

    public function tandaiSebagaiSelesai(Transaksi $transaksi)
    {
        $user = Auth::user();
        $pelanggan = $user->pelanggan;

        // Validasi bahwa transaksi ini milik pelanggan yang sedang login
        if ($transaksi->pelanggan_id !== $pelanggan->pelanggan_id) {
            return redirect()->back()->with('error', 'Anda tidak memiliki akses ke transaksi ini.');
        }

        // Validasi bahwa status transaksi adalah 'dikirim'
        if ($transaksi->status_transaksi !== 'dikirim') {
            return redirect()->back()->with('error', 'Status transaksi tidak valid untuk operasi ini.');
        }

        try {
            // Update status transaksi menjadi 'selesai'
            $transaksi->status_transaksi = 'selesai';
            $transaksi->save();

            // Log aktivitas
            Log::info("Transaksi {$transaksi->invoice_id} telah ditandai sebagai selesai oleh pelanggan {$pelanggan->pelanggan_id}");

            return redirect()->back()->with('success', 'Pesanan berhasil ditandai sebagai selesai.');
        } catch (\Exception $e) {
            Log::error("Error saat menandai transaksi {$transaksi->invoice_id} sebagai selesai: " . $e->getMessage());
            return redirect()->back()->with('error', 'Terjadi kesalahan saat memproses permintaan Anda.');
        }
    }
}
