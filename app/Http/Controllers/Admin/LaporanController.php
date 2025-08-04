<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class LaporanController extends Controller
{
    /**
     * Laporan Transaksi
     */
    public function transaksi(Request $request)
    {
        $date_start = $request->input('date_start', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $date_end = $request->input('date_end', Carbon::now()->format('Y-m-d'));
        
        $transaksi = DB::table("transaksi")
            ->select(
                "transaksi.transaksi_id as id",
                "transaksi.invoice_id as kode_invoice", 
                "transaksi.created_at as tanggal",
                "transaksi.total_belanja",
                "transaksi.biaya_pengiriman as total_ongkir",
                "transaksi.total_keseluruhan",
                "transaksi.status_pembayaran",
                "transaksi.status_transaksi",
                "pelanggan.nama_lengkap as nama_pelanggan"
            )
            ->join("pelanggan", "pelanggan.pelanggan_id", "=", "transaksi.pelanggan_id")
            ->whereBetween(DB::raw("DATE(transaksi.created_at)"), [$date_start, $date_end])
            ->orderBy("transaksi.created_at", "desc")
            ->get();
        
        foreach ($transaksi as $item) {
            $item->detail_produk = DB::table('detail_transaksi')
                ->select(
                    'detail_transaksi.produk_id',
                    'detail_transaksi.nama_produk',
                    'detail_transaksi.jumlah',
                    'detail_transaksi.harga_satuan as harga',
                    'detail_transaksi.subtotal'
                )
                ->where('detail_transaksi.transaksi_id', $item->id)
                ->get();
        }

        $summary = [
            'total_transaksi' => $transaksi->count(),
            'total_pendapatan' => $transaksi->where('status_transaksi', 'selesai')->sum('total_belanja'),
            'total_pendapatan_dengan_ongkir' => $transaksi->where('status_transaksi', 'selesai')->sum('total_keseluruhan'),
            'status_transaksi' => [
                'pending' => $transaksi->where('status_transaksi', 'pending')->count(),
                'proses' => $transaksi->where('status_transaksi', 'proses')->count(),
                'dikirim' => $transaksi->where('status_transaksi', 'dikirim')->count(),
                'selesai' => $transaksi->where('status_transaksi', 'selesai')->count(),
                'batal' => $transaksi->where('status_transaksi', 'batal')->count(),
            ],
        ];
        
        return Inertia::render('admin/laporan/transaksi', [
            'transaksi' => $transaksi,
            'summary' => $summary,
            'filter' => [
                'date_start' => $date_start,
                'date_end' => $date_end,
            ]
        ]);
    }

    /**
     * Generate PDF Laporan Transaksi
     */
    public function transaksiPDF(Request $request)
    {
        $date_start = $request->input('date_start', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $date_end = $request->input('date_end', Carbon::now()->format('Y-m-d'));
        
        $transaksi = DB::table("transaksi")
            ->select(
                "transaksi.transaksi_id as id",
                "transaksi.invoice_id as kode_invoice", 
                "transaksi.created_at as tanggal",
                "transaksi.total_belanja",
                "transaksi.biaya_pengiriman as total_ongkir",
                "transaksi.total_keseluruhan",
                "transaksi.status_pembayaran",
                "transaksi.status_transaksi",
                "pelanggan.nama_lengkap as nama_pelanggan"
            )
            ->where("transaksi.status_transaksi", "=", "selesai")
            ->join("pelanggan", "pelanggan.pelanggan_id", "=", "transaksi.pelanggan_id")
            ->whereBetween(DB::raw("DATE(transaksi.created_at)"), [$date_start, $date_end])
            ->orderBy("transaksi.created_at", "desc")
            ->get();
            
        $detail_transaksi = DB::table('detail_transaksi')
            ->select(
                'detail_transaksi.transaksi_id',
                'detail_transaksi.produk_id',
                'detail_transaksi.nama_produk',
                'detail_transaksi.jumlah',
                'detail_transaksi.harga_satuan',
                'detail_transaksi.subtotal',
                'transaksi.created_at as tanggal',
                'transaksi.biaya_pengiriman as total_ongkir'
            )
            ->join('transaksi', 'transaksi.transaksi_id', '=', 'detail_transaksi.transaksi_id')
            ->where("transaksi.status_transaksi", "=", "selesai")
            ->whereBetween(DB::raw("DATE(transaksi.created_at)"), [$date_start, $date_end])
            ->orderBy("transaksi.created_at", "desc")
            ->get();
            
        $transaksiAgrupada = collect($transaksi)->groupBy('id')->toArray();
        foreach ($detail_transaksi as $item) {
            $transaksi_data = $transaksiAgrupada[$item->transaksi_id] ?? null;
            if ($transaksi_data) {
                $transaksi_item = $transaksi_data[0];
                $items_en_transaccion = DB::table('detail_transaksi')->where('transaksi_id', $item->transaksi_id)->count();
                $item->ongkir_por_producto = $item->total_ongkir / $items_en_transaccion;
            } else {
                $item->ongkir_por_producto = 0;
            }
        }

        $summary = [
            'total_transaksi' => $transaksi->count(),
            'total_pendapatan' => $transaksi->where('status_transaksi', 'selesai')->sum('total_belanja'),
            'total_pendapatan_dengan_ongkir' => $transaksi->where('status_transaksi', 'selesai')->sum('total_keseluruhan'),
            'status_transaksi' => [
                'pending' => $transaksi->where('status_transaksi', 'pending')->count(),
                'proses' => $transaksi->where('status_transaksi', 'proses')->count(),
                'dikirim' => $transaksi->where('status_transaksi', 'dikirim')->count(),
                'selesai' => $transaksi->where('status_transaksi', 'selesai')->count(),
                'batal' => $transaksi->where('status_transaksi', 'batal')->count(),
            ],
        ];
        
        $pdf = PDF::loadView('laporan.transaksi_pdf', [
            'transaksi' => $transaksi,
            'detail_transaksi' => $detail_transaksi,
            'summary' => $summary,
            'date_start' => $date_start,
            'date_end' => $date_end
        ]);
        
        return $pdf->download('laporan-transaksi-'.$date_start.'-'.$date_end.'.pdf');
    }

    /**
     * Laporan Pendapatan
     */
    public function pendapatan(Request $request)
    {
        $period = $request->input('period', 'monthly');
        $year = $request->input('year', Carbon::now()->year);
        
        $data = [];
        $labels = [];
        
        if ($period == 'daily') {
            $month = $request->input('month', Carbon::now()->month);
            $days_in_month = Carbon::createFromDate($year, $month, 1)->daysInMonth;
            
            for ($i = 1; $i <= $days_in_month; $i++) {
                $date = Carbon::createFromDate($year, $month, $i)->format('Y-m-d');
                $labels[] = $i;
                
                $pendapatan = DB::table('transaksi')
                    ->where('status_transaksi', 'selesai')
                    ->whereDate('created_at', $date)
                    ->sum('total_belanja');
                
                $pendapatan_dengan_ongkir = DB::table('transaksi')
                    ->where('status_transaksi', 'selesai')
                    ->whereDate('created_at', $date)
                    ->sum('total_keseluruhan');
                
                $data[] = [
                    'date' => $date,
                    'pendapatan' => $pendapatan,
                    'pendapatan_dengan_ongkir' => $pendapatan_dengan_ongkir
                ];
            }
            
            $filter = [
                'period' => $period,
                'year' => $year,
                'month' => $month,
                'month_name' => Carbon::createFromDate($year, $month, 1)->format('F'),
            ];
        } else {
            // Monthly data
            for ($i = 1; $i <= 12; $i++) {
                $month_name = Carbon::createFromDate($year, $i, 1)->format('F');
                $labels[] = $month_name;
                
                // Start and end dates for the month
                $start_date = Carbon::createFromDate($year, $i, 1)->startOfMonth()->format('Y-m-d');
                $end_date = Carbon::createFromDate($year, $i, 1)->endOfMonth()->format('Y-m-d');
                
                // Pendapatan (tanpa ongkir)
                $pendapatan = DB::table('transaksi')
                    ->where('status_transaksi', 'selesai')
                    ->whereBetween(DB::raw('DATE(created_at)'), [$start_date, $end_date])
                    ->sum('total_belanja');
                
                // Pendapatan dengan ongkir
                $pendapatan_dengan_ongkir = DB::table('transaksi')
                    ->where('status_transaksi', 'selesai')
                    ->whereBetween(DB::raw('DATE(created_at)'), [$start_date, $end_date])
                    ->sum('total_keseluruhan');
                
                $data[] = [
                    'month' => $i,
                    'month_name' => $month_name,
                    'pendapatan' => $pendapatan,
                    'pendapatan_dengan_ongkir' => $pendapatan_dengan_ongkir
                ];
            }
            
            $filter = [
                'period' => $period,
                'year' => $year,
            ];
        }
        
        $summary = [
            'total_pendapatan' => array_sum(array_column($data, 'pendapatan')),
            'total_pendapatan_dengan_ongkir' => array_sum(array_column($data, 'pendapatan_dengan_ongkir')),
        ];
        
        return Inertia::render('admin/laporan/pendapatan', [
            'data' => $data,
            'labels' => $labels,
            'summary' => $summary,
            'filter' => $filter
        ]);
    }

    /**
     * Generate PDF Laporan Pendapatan
     */
    public function pendapatanPDF(Request $request)
    {
        $period = $request->input('period', 'monthly');
        $year = $request->input('year', Carbon::now()->year);
        
        $data = [];
        
        if ($period == 'daily') {
            $month = $request->input('month', Carbon::now()->month);
            $days_in_month = Carbon::createFromDate($year, $month, 1)->daysInMonth;
            
            for ($i = 1; $i <= $days_in_month; $i++) {
                $date = Carbon::createFromDate($year, $month, $i)->format('Y-m-d');
                
                $pendapatan = DB::table('transaksi')
                    ->where('status_transaksi', 'selesai')
                    ->whereDate('created_at', $date)
                    ->sum('total_belanja');
                
                $pendapatan_dengan_ongkir = DB::table('transaksi')
                    ->where('status_transaksi', 'selesai')
                    ->whereDate('created_at', $date)
                    ->sum('total_keseluruhan');
                
                $data[] = [
                    'date' => $date,
                    'day' => $i,
                    'pendapatan' => $pendapatan,
                    'pendapatan_dengan_ongkir' => $pendapatan_dengan_ongkir
                ];
            }
            
            $period_text = "Harian - " . Carbon::createFromDate($year, $month, 1)->format('F Y');
        } else {
            for ($i = 1; $i <= 12; $i++) {
                $month_name = Carbon::createFromDate($year, $i, 1)->format('F');
                
                $start_date = Carbon::createFromDate($year, $i, 1)->startOfMonth()->format('Y-m-d');
                $end_date = Carbon::createFromDate($year, $i, 1)->endOfMonth()->format('Y-m-d');
                
                $pendapatan = DB::table('transaksi')
                    ->where('status_transaksi', 'selesai')
                    ->whereBetween(DB::raw('DATE(created_at)'), [$start_date, $end_date])
                    ->sum('total_belanja');
                
                $pendapatan_dengan_ongkir = DB::table('transaksi')
                    ->where('status_transaksi', 'selesai')
                    ->whereBetween(DB::raw('DATE(created_at)'), [$start_date, $end_date])
                    ->sum('total_keseluruhan');
                
                $data[] = [
                    'month' => $i,
                    'month_name' => $month_name,
                    'pendapatan' => $pendapatan,
                    'pendapatan_dengan_ongkir' => $pendapatan_dengan_ongkir
                ];
            }
            
            $period_text = "Bulanan - Tahun " . $year;
        }
        
        $summary = [
            'total_pendapatan' => array_sum(array_column($data, 'pendapatan')),
            'total_pendapatan_dengan_ongkir' => array_sum(array_column($data, 'pendapatan_dengan_ongkir')),
        ];
        
        $pdf = PDF::loadView('laporan.pendapatan_pdf', [
            'data' => $data,
            'summary' => $summary,
            'period' => $period,
            'period_text' => $period_text,
            'year' => $year
        ]);
        
        return $pdf->download('laporan-pendapatan-'.$year.($period == 'daily' ? '-'.Carbon::createFromDate($year, $month, 1)->format('m') : '').'.pdf');
    }

    /**
     * Laporan Produk
     */
    public function produk(Request $request)
    {
        $date_start = $request->input('date_start', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $date_end = $request->input('date_end', Carbon::now()->format('Y-m-d'));

        $produk_terlaku = DB::table('detail_transaksi')
            ->select(
                'detail_transaksi.produk_id',
                'detail_transaksi.nama_produk',
                'detail_transaksi.harga_satuan as harga',
                DB::raw('SUM(detail_transaksi.jumlah) as total_terjual'),
                DB::raw('SUM(detail_transaksi.subtotal) as total_pendapatan')
            )
            ->join('transaksi', 'transaksi.transaksi_id', '=', 'detail_transaksi.transaksi_id')
            ->where('transaksi.status_transaksi', 'selesai')
            ->whereBetween(DB::raw('DATE(transaksi.created_at)'), [$date_start, $date_end])
            ->groupBy('detail_transaksi.produk_id', 'detail_transaksi.nama_produk', 'detail_transaksi.harga_satuan')
            ->orderByDesc('total_terjual')
            ->get();

        // Summary stats
        $summary = [
            'total_produk' => $produk_terlaku->count(),
            'total_terjual' => $produk_terlaku->sum('total_terjual'),
            'total_pendapatan' => $produk_terlaku->sum('total_pendapatan'),
        ];
        
        return Inertia::render('admin/laporan/produk', [
            'produk_terlaku' => $produk_terlaku,
            'summary' => $summary,
            'filter' => [
                'date_start' => $date_start,
                'date_end' => $date_end,
            ]
        ]);
    }

    /**
     * Generate PDF Laporan Produk
     */
    public function produkPDF(Request $request)
    {
        $date_start = $request->input('date_start', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $date_end = $request->input('date_end', Carbon::now()->format('Y-m-d'));

        $produk_terlaku = DB::table('detail_transaksi') 
            ->select(
                'detail_transaksi.produk_id',
                'detail_transaksi.nama_produk',
                'detail_transaksi.harga_satuan as harga',
                DB::raw('SUM(detail_transaksi.jumlah) as total_terjual'),
                DB::raw('SUM(detail_transaksi.subtotal) as total_pendapatan')
            )
            ->join('transaksi', 'transaksi.transaksi_id', '=', 'detail_transaksi.transaksi_id')
            ->where('transaksi.status_transaksi', 'selesai')
            ->whereBetween(DB::raw('DATE(transaksi.created_at)'), [$date_start, $date_end])
            ->groupBy('detail_transaksi.produk_id', 'detail_transaksi.nama_produk', 'detail_transaksi.harga_satuan')
            ->orderByDesc('total_terjual')
            ->get();

        $summary = [
            'total_produk' => $produk_terlaku->count(),
            'total_terjual' => $produk_terlaku->sum('total_terjual'),
            'total_pendapatan' => $produk_terlaku->sum('total_pendapatan'),
        ];
        
        $pdf = PDF::loadView('laporan.produk_pdf', [
            'produk_terlaku' => $produk_terlaku,
            'summary' => $summary,
            'date_start' => $date_start,
            'date_end' => $date_end
        ]);
        
        return $pdf->download('laporan-produk-'.$date_start.'-'.$date_end.'.pdf');
    }
}
