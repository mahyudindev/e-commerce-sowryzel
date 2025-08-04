<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>LAPORAN PRODUK TERLARIS</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            border: 1px solid #000;
            padding: 5px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
        }
        .header {
            margin-bottom: 25px;
            padding: 15px 0;
            border-bottom: 2px solid #4f46e5;
            display: flex;
            align-items: center;
            min-height: 120px;
        }
        .logo-container {
            width: 100px;
            padding: 0 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100px;
        }
        .logo {
            max-height: 80px;
            max-width: 90px;
        }
        .header-content {
            flex: 1;
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        .header h1 {
            margin-bottom: 5px;
            font-size: 22px;
            font-weight: bold;
            color: #4f46e5;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .header p {
            margin: 4px 0;
            color: #444;
            font-size: 14px;
        }
        .total-row td {
            font-weight: bold;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
    </style>
</head>
<body>
    <table style="width: 100%; border: none; margin-bottom: 20px; background: #ffffff;">
        <tr>
            <td style="width: 100px; vertical-align: middle; text-align: left; padding: 10px;">
                <img src="{{ public_path('/images/logo.png') }}" style="max-width: 90px; max-height: 90px;">
            </td>
            <td style="vertical-align: middle; text-align: center; padding: 10px;">
                <h1 style="margin: 0; font-size: 22px; font-weight: bold; color: #4f46e5; text-transform: uppercase; letter-spacing: 1px;">LAPORAN PRODUK TERLARIS</h1>
                <p style="margin: 5px 0; font-size: 14px;"><strong>Periode:</strong> {{ date('d-m-Y', strtotime($date_start)) }} s/d {{ date('d-m-Y', strtotime($date_end)) }}</p>
                <p style="margin: 5px 0; font-size: 14px; font-style: italic;">Transaksi dengan status "Selesai"</p>
                <p style="margin: 5px 0; font-weight: bold; font-size: 16px; color: #333;">SOWRYZEL</p>
            </td>
        </tr>
    </table>

    <table style="width: 100%; margin-bottom: 20px;">
        <tr>
            <td style="width: 33.33%; text-align: center; padding: 10px; background-color: #f8f9fa;">
                <p style="margin: 0; font-weight: bold;">Total Produk</p>
                <h3 style="margin: 5px 0;">{{ $summary['total_produk'] }}</h3>
                <p style="margin: 0; font-style: italic;">produk</p>
            </td>
            <td style="width: 33.33%; text-align: center; padding: 10px; background-color: #f8f9fa;">
                <p style="margin: 0; font-weight: bold;">Total Terjual</p>
                <h3 style="margin: 5px 0;">{{ $summary['total_terjual'] }}</h3>
                <p style="margin: 0; font-style: italic;">item</p>
            </td>
            <td style="width: 33.33%; text-align: center; padding: 10px; background-color: #f8f9fa;">
                <p style="margin: 0; font-weight: bold;">Total Pendapatan</p>
                <h3 style="margin: 5px 0;">Rp {{ number_format($summary['total_pendapatan'], 0, ',', '.') }}</h3>
            </td>
        </tr>
    </table>

    <table>
        <thead>
            <tr>
                <th>No</th>
                <th>Nama Produk</th>
                <th>Harga</th>
                <th>Total Terjual</th>
                <th>Total Pendapatan</th>
            </tr>
        </thead>
        <tbody>
            @php
                $no = 1;
                $total_terjual = 0;
                $total_pendapatan = 0;
            @endphp
            
            @foreach($produk_terlaku as $item)
            <tr>
                <td class="text-center">{{ $no++ }}</td>
                <td>{{ $item->nama_produk }}</td>
                <td class="text-right">Rp {{ number_format($item->harga, 0, ',', '.') }}</td>
                <td class="text-center">{{ $item->total_terjual }} item</td>
                <td class="text-right">Rp {{ number_format($item->total_pendapatan, 0, ',', '.') }}</td>
            </tr>
            @php
                $total_terjual += $item->total_terjual;
                $total_pendapatan += $item->total_pendapatan;
            @endphp
            @endforeach
            
            <tr class="total-row">
                <td colspan="3" class="text-right">Total</td>
                <td class="text-center">{{ $total_terjual }} item</td>
                <td class="text-right">Rp {{ number_format($total_pendapatan, 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>
    
    <div style="margin-top: 30px; text-align: right;">
        <p>Dicetak pada: {{ date('d F Y H:i:s') }}</p>
    </div>
</body>
</html>
