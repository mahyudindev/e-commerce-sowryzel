<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Produk;
use App\Models\Transaksi;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DebugDashboardController extends Controller
{
    /**
     * Display a debug version of the admin dashboard with direct database access
     */
    public function index()
    {
        try {
            $totalPendapatan = DB::table('transaksi')
                ->where('status_transaksi', 'selesai')
                ->where('status_pembayaran', 'paid')
                ->sum('total_belanja');
            
            \Log::info('Debug Dashboard: Total pendapatan (tanpa ongkir)', ['value' => $totalPendapatan]);

            $totalPendapatanDenganOngkir = DB::table('transaksi')
                ->where('status_transaksi', 'selesai')
                ->where('status_pembayaran', 'paid')
                ->sum('total_keseluruhan');
            
            \Log::info('Debug Dashboard: Total pendapatan (dengan ongkir)', ['value' => $totalPendapatanDenganOngkir]);

            $totalTransaksi = DB::table('transaksi')->count();
            
            $totalBarang = DB::table('produk')->count();
            
            $transaksiPending = DB::table('transaksi')
                ->where('status_transaksi', 'pending')
                ->count();
            
            $transaksiSukses = DB::table('transaksi')
                ->where('status_transaksi', 'selesai')
                ->count();
            
            $pendapatanPerBulan = [];
            
            for ($i = 5; $i >= 0; $i--) {
                $date = Carbon::now()->subMonths($i);
                $month = $date->month;
                $year = $date->year;
                $monthName = Carbon::create()->month($month)->locale('id')->monthName;
                
                $revenue = DB::table('transaksi')
                    ->where('status_transaksi', 'selesai')
                    ->whereMonth('created_at', $month)
                    ->whereYear('created_at', $year)
                    ->sum('total_belanja');
                
                \Log::info("Debug Dashboard: Monthly revenue for {$monthName} {$year}", [
                    'month' => $month,
                    'year' => $year,
                    'revenue' => $revenue
                ]);
                
                $pendapatanPerBulan[] = [
                    'name' => $monthName,
                    'Pendapatan' => (float) $revenue
                ];
            }
            
            // Get a few recent transactions
            $recentTransactions = DB::table('transaksi')
                ->join('pelanggan', 'transaksi.pelanggan_id', '=', 'pelanggan.pelanggan_id')
                ->select(
                    'transaksi.transaksi_id as id',
                    'transaksi.invoice_id as invoice',
                    'pelanggan.nama_lengkap as customer',
                    'transaksi.total_belanja as total',
                    'transaksi.status_transaksi as status',
                    'transaksi.created_at as date'
                )
                ->orderBy('transaksi.created_at', 'desc')
                ->limit(5)
                ->get()
                ->map(function ($item) {
                    $statusMap = [
                        'pending' => 'Pending',
                        'dikemas' => 'Dikemas',
                        'dikirim' => 'Dikirim',
                        'selesai' => 'Sukses',
                        'batal' => 'Gagal',
                    ];
                    
                    return [
                        'id' => $item->id,
                        'invoice' => $item->invoice,
                        'customer' => $item->customer ?? 'Unknown',
                        'amount' => 'Rp ' . number_format($item->total, 0, ',', '.'),
                        'status' => $statusMap[$item->status] ?? 'Pending',
                        'date' => Carbon::parse($item->date)->format('d M Y'),
                    ];
                });
            
            $persentasePendapatan = '+15%';
            $persentaseTransaksi = '+10%';
            $persentaseBarang = '+5%';
            $persentasePending = '+3%';
            $persentaseSukses = '+20%';
            
            $dashboardData = [
                'totalPendapatan' => floatval($totalPendapatan),
                'totalPendapatanDenganOngkir' => floatval($totalPendapatanDenganOngkir),
                'totalTransaksi' => intval($totalTransaksi),
                'totalBarang' => intval($totalBarang),
                'transaksiPending' => intval($transaksiPending),
                'transaksiSukses' => intval($transaksiSukses),
                'pendapatanPerBulan' => $pendapatanPerBulan,
                'recentTransactions' => $recentTransactions->toArray(),
                'persentasePendapatan' => $persentasePendapatan,
                'persentaseTransaksi' => $persentaseTransaksi,
                'persentaseBarang' => $persentaseBarang,
                'persentasePending' => $persentasePending,
                'persentaseSukses' => $persentaseSukses,
            ];
            
            $debugInfo = [
                'rawTotalPendapatan' => $totalPendapatan,
                'rawTotalTransaksi' => $totalTransaksi,
                'rawTotalBarang' => $totalBarang,
                'rawTransaksiPending' => $transaksiPending,
                'rawTransaksiSukses' => $transaksiSukses,
            ];
            
            return Inertia::render('admin/dashboard', [
                'dashboardData' => $dashboardData,
                'debugInfo' => $debugInfo
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Debug Dashboard Error: ' . $e->getMessage());
            \Log::error('Error trace: ' . $e->getTraceAsString());
            
            return Inertia::render('admin/dashboard', [
                'dashboardData' => [
                    'totalPendapatan' => 0,
                    'totalTransaksi' => 0,
                    'totalBarang' => 0,
                    'transaksiPending' => 0,
                    'transaksiSukses' => 0,
                    'pendapatanPerBulan' => [],
                    'recentTransactions' => [],
                    'persentasePendapatan' => '0%',
                    'persentaseTransaksi' => '0%',
                    'persentaseBarang' => '0%',
                    'persentasePending' => '0%',
                    'persentaseSukses' => '0%',
                ],
                'debugInfo' => ['error' => $e->getMessage()]
            ]);
        }
    }
}
