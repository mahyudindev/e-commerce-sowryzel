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
        Schema::table('ulasan', function (Blueprint $table) {
            $table->unsignedBigInteger('detail_transaksi_id')->nullable()->after('produk_id');

            $table->foreign('detail_transaksi_id')
                  ->references('detail_transaksi_id')->on('detail_transaksi')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ulasan', function (Blueprint $table) {
            $table->dropForeign(['detail_transaksi_id']);
            $table->dropColumn('detail_transaksi_id');
        });
    }
};
