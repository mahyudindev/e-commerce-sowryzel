<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Label Pengiriman - {{ $transaksi->invoice_id }}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            font-size: 10pt;
            color: #000;
        }
        .label-container {
            width: 100%; /* Adjust as needed, e.g., 4in */
            height: auto; /* Adjust as needed, e.g., 6in */
            border: 1px solid #555;
            padding: 5px;
            box-sizing: border-box;
            overflow: hidden;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        td {
            border: 1px solid #ccc;
            padding: 8px;
            vertical-align: top;
        }
        .no-border td {
            border: none;
        }
        .header-company-name {
            font-size: 16pt;
            font-weight: bold;
            text-align: center;
            color: #D32F2F; /* Red color similar to image */
        }
        .logo-placeholder {
            width: 80px;
            height: 40px;
            border: 1px dashed #ccc;
            text-align: center;
            line-height: 40px;
            font-size: 8pt;
            color: #777;
        }
        .section-title {
            font-weight: bold;
            font-size: 11pt;
            margin-bottom: 4px;
            color: #D32F2F; /* Red color */
        }
        .address-block p {
            margin: 0 0 3px 0;
            line-height: 1.3;
        }
        .info-block p {
            margin: 0 0 3px 0;
            font-size: 9pt;
        }
        .info-block strong {
            font-weight: bold;
        }
        .handling-icons img {
            height: 20px;
            margin-right: 5px;
            vertical-align: middle;
        }
        .tracking-info {
            font-size: 9pt;
        }
        .barcode-placeholder {
            width: 100%;
            height: 50px;
            border: 1px dashed #ccc;
            text-align: center;
            line-height: 50px;
            font-size: 10pt;
            color: #777;
            margin-top: 5px;
        }
        .vertical-text {
            writing-mode: vertical-rl;
            text-orientation: mixed;
            white-space: nowrap;
            font-size: 7pt;
            color: #777;
            text-align: center;
            border-left: 1px solid #ccc;
            padding-left: 2px;
        }
        .full-width td {
            width: 100%;
        }
        .half-width {
            width: 50%;
        }
        .third-width {
            width: 33.33%;
        }
        .two-thirds-width {
            width: 66.67%;
        }
        .small-text {
            font-size: 8pt;
        }
        .icon-mail {
            width: 30px; /* Adjust as needed */
            height: auto;
            margin-top: 5px;
        }

        /* Placeholder for actual icons if not using images */
        .icon-fragile::before { content: "\1F4A5"; /* Example: collision symbol, find better unicode */ margin-right: 5px; }
        .icon-arrows::before { content: "\2191\2191"; margin-right: 5px; }
        .icon-umbrella::before { content: "\2614"; margin-right: 5px; }

    </style>
</head>
<body>
    <div class="label-container">
        <table>
            <tr class="no-border">
                <td style="width: 25%; vertical-align: top;">
                    <img src="{{ public_path('images/logo.png') }}" alt="SOWRYZEL Logo" style="width: 80px; height: auto; max-height: 40px; border: none;">
                </td>
                <td colspan="2" class="header-company-name" style="vertical-align: middle;">
                    {{-- Ganti dengan nama perusahaan Anda dari config atau hardcode --}}
                    SOWRYZEL
                </td>
                <td rowspan="4" class="vertical-text" style="width: 15px;">
                    Label Pengiriman - sowryzel.com
                </td>
            </tr>
            <tr>
                <td rowspan="2" style="width: 40%;">
                    <div class="section-title" style="color: #000;">KEPADA:</div>
                    <div class="address-block">
                        <p><strong>{{ $alamatPengiriman['nama_penerima'] ?? ($pelanggan->user->name ?? $pelanggan->nama_lengkap ?? 'N/A') }}</strong></p>
                        <p>{{ $alamatPengiriman['alamat_lengkap'] ?? 'N/A' }}</p>
                        <p>
                            {{ $alamatPengiriman['kecamatan'] ? $alamatPengiriman['kecamatan'] . ', ' : '' }}
                            {{ $alamatPengiriman['kota_nama'] ?? 'N/A' }}
                        </p>
                        <p>
                            {{ $alamatPengiriman['provinsi_nama'] ?? 'N/A' }} - {{ $alamatPengiriman['kode_pos'] ?? 'N/A' }}
                        </p>
                        <p>Telp: {{ $alamatPengiriman['no_telepon'] ?? ($pelanggan->no_telepon ?? 'N/A') }}</p>

                    </div>
                </td>
                <td colspan="2" style="width: 60%;">
                    <div class="section-title">{{ strtoupper($alamatPengiriman['layanan_kurir'] ?? 'LAYANAN REGULER') }}</div>
                    <div class="info-block address-block">
                        <p><strong>DARI:</strong></p>
                        <p><strong>SOWRYZEL</strong></p>
                        <p>Jl. Cik Ditiro, Kedaleman, Cilegon</p>
                        <p>Kota Cilegon, Banten 42422</p>
                    </div>
                </td>
            </tr>
            <tr>
                <td colspan="2" style="width: 60%;">
                    <div class="info-block">
                        <p><strong>NO. REF:</strong> {{ $transaksi->invoice_id }}</p>
                        <p><strong>TGL. KIRIM:</strong> {{ $transaksi->created_at->format('d-m-Y') }}</p>
                        <p><strong>BERAT:</strong> {{ number_format(($transaksi->total_berat ?? 0) / 1000, 2) }} kg</p>
                        {{-- <p><strong>LOT NUMBER:</strong> 12345678</p> --}}
                    </div>
                </td>
            </tr>
            <tr>
                <td>

                </td>
            </tr>
        </table>
    </div>
</body>
</html>