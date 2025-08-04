<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>LAPORAN PENJUALAN HARIAN</title>
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
            background: #f8fafc;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
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
                <h1 style="margin: 0; font-size: 22px; font-weight: bold; color: #4f46e5; text-transform: uppercase; letter-spacing: 1px;">LAPORAN TRANSAKSI</h1>
                <p style="margin: 5px 0; font-size: 14px;"><strong>Periode:</strong> {{ date('d-m-Y', strtotime($date_start)) }} s/d {{ date('d-m-Y', strtotime($date_end)) }}</p>
                <p style="margin: 5px 0; font-size: 14px; font-style: italic;">Transaksi dengan status "Selesai"</p>
                <p style="margin: 5px 0; font-weight: bold; font-size: 16px; color: #333;">SOWRYZEL</p>
            </td>
        </tr>
    </table>

    <table>
        <thead>
            <tr>
                <th>Tanggal</th>
                <th>Produk</th>
                <th>Jumlah</th>
                <th>Harga</th>
                <th>Ongkir</th>
                <th>Jumlah</th>
            </tr>
        </thead>
        <tbody>
            @php
                $total_penjualan = 0;
                $total_ongkir = 0;
                $total_keseluruhan = 0;
                $total_items = 0;
            @endphp
            
            @foreach($detail_transaksi as $item)
            <tr>
                <td>{{ date('d F Y', strtotime($item->tanggal)) }}</td>
                <td>{{ $item->nama_produk }}</td>
                <td class="text-center">{{ $item->jumlah }}</td>
                <td class="text-right">{{ number_format($item->harga_satuan, 0, ',', '.') }}</td>
                <td class="text-right">{{ number_format($item->ongkir_por_producto, 0, ',', '.') }}</td>
                <td class="text-right">{{ number_format($item->subtotal + $item->ongkir_por_producto, 0, ',', '.') }}</td>
            </tr>
            @php
                $total_penjualan += ($item->harga_satuan * $item->jumlah);
                $total_ongkir += $item->ongkir_por_producto;
                $total_keseluruhan += ($item->subtotal + $item->ongkir_por_producto);
                $total_items += $item->jumlah;
            @endphp
            @endforeach
            
            <tr class="total-row">
                <td colspan="3">Total Penjualan</td>
                <td class="text-right">{{ number_format($total_penjualan, 0, ',', '.') }}</td>
                <td class="text-right">{{ number_format($total_ongkir, 0, ',', '.') }}</td>
                <td class="text-right">{{ number_format($total_keseluruhan, 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>

    <table style="width: 100%; margin-top: 40px; border: none;">
        <tr>
            <td style="width: 50%; text-align: center; border: none;">
                <p>Penanggung Jawab</p>
                <p>Admin</p>
                <br><br><br>
                <p><strong>Rio Spetian</strong></p>
            </td>
            <td style="width: 50%; text-align: center; border: none;">
                <p>Mengetahui</p>
                <p>Owner</p>
                <br><br><br>
                <p><strong>Elena kia pancawati</strong></p>
            </td>
        </tr>
    </table>
</body>
</html>
