<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('transaksi', function (Blueprint $table) {
            $table->id('transaksi_id');
            $table->foreignId('pelanggan_id')->constrained('pelanggan', 'pelanggan_id')->onDelete('cascade');
            $table->string('invoice_id')->unique();
            $table->decimal('total_belanja', 15, 2);
            $table->decimal('biaya_pengiriman', 15, 2)->default(0);
            $table->decimal('total_keseluruhan', 15, 2);
            $table->enum('status_transaksi', ['pending', 'processing', 'shipped', 'completed', 'cancelled', 'failed'])->default('pending');
            $table->enum('status_pembayaran', ['unpaid', 'paid', 'failed', 'expired'])->default('unpaid');
            $table->string('metode_pembayaran')->nullable();
            $table->string('snap_token')->nullable();
            $table->string('midtrans_transaction_id')->nullable();
            $table->text('alamat_pengiriman_json');
            $table->text('catatan_pelanggan')->nullable();
            $table->timestamp('stock_reverted_at')->nullable();
            $table->timestamps();

            $table->index('pelanggan_id');
            $table->index('invoice_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transaksi');
    }
};
