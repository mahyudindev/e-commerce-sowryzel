<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Pendapatan</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .header h1 {
            margin-bottom: 5px;
        }
        .info {
            margin-bottom: 20px;
        }
        .info-item {
            margin-bottom: 5px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
        }
        .summary {
            margin-top: 20px;
            margin-bottom: 20px;
        }
        .summary-table {
            width: 50%;
            margin-bottom: 20px;
        }
        .footer {
            margin-top: 50px;
            text-align: right;
        }
        .page-break {
            page-break-after: always;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Laporan Pendapatan</h1>
        <p>{{ $period_text }}</p>
    </div>

    <div class="info">
        <div class="info-item"><strong>Tanggal Cetak:</strong> {{ date('d F Y H:i:s') }}</div>
    </div>

    <div class="summary">
        <h3>Ringkasan</h3>
        <table class="summary-table">
            <tr>
                <td><strong>Total Pendapatan (tanpa ongkir)</strong></td>
                <td>Rp {{ number_format($summary['total_pendapatan'], 0, ',', '.') }}</td>
            </tr>
            <tr>
                <td><strong>Total Pendapatan (dengan ongkir)</strong></td>
                <td>Rp {{ number_format($summary['total_pendapatan_dengan_ongkir'], 0, ',', '.') }}</td>
            </tr>
        </table>
    </div>

    <h3>Detail Pendapatan</h3>
    <table>
        <thead>
            <tr>
                <th>No</th>
                @if($period == 'daily')
                    <th>Tanggal</th>
                @else
                    <th>Bulan</th>
                @endif
                <th>Pendapatan (tanpa ongkir)</th>
                <th>Pendapatan (dengan ongkir)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $index => $item)
            <tr>
                <td>{{ $index + 1 }}</td>
                @if($period == 'daily')
                    <td>{{ $item['day'] }} {{ date('F', mktime(0, 0, 0, $data[0]['month'], 1, $year)) }} {{ $year }}</td>
                @else
                    <td>{{ $item['month_name'] }} {{ $year }}</td>
                @endif
                <td>Rp {{ number_format($item['pendapatan'], 0, ',', '.') }}</td>
                <td>Rp {{ number_format($item['pendapatan_dengan_ongkir'], 0, ',', '.') }}</td>
            </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr>
                <th colspan="2">Total</th>
                <th>Rp {{ number_format($summary['total_pendapatan'], 0, ',', '.') }}</th>
                <th>Rp {{ number_format($summary['total_pendapatan_dengan_ongkir'], 0, ',', '.') }}</th>
            </tr>
        </tfoot>
    </table>

    <div class="footer">
        <p>Dicetak oleh: Admin</p>
    </div>
</body>
</html>
