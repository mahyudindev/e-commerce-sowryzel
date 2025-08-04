<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Temporarily change to string to allow updating values not in the new enum
        DB::statement("ALTER TABLE transaksi MODIFY COLUMN status_transaksi VARCHAR(255) DEFAULT 'pending'");

        // Update existing statuses
        DB::table('transaksi')->where('status_transaksi', 'processing')->update(['status_transaksi' => 'dikemas']);
        DB::table('transaksi')->where('status_transaksi', 'shipped')->update(['status_transaksi' => 'dikirim']);
        DB::table('transaksi')->where('status_transaksi', 'completed')->update(['status_transaksi' => 'selesai']);
        DB::table('transaksi')->whereIn('status_transaksi', ['cancelled', 'failed'])->update(['status_transaksi' => 'batal']);

        // Change to new enum definition
        DB::statement("ALTER TABLE transaksi MODIFY COLUMN status_transaksi ENUM('pending', 'dikemas', 'dikirim', 'selesai', 'batal') DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Temporarily change to string to allow updating values not in the old enum
        DB::statement("ALTER TABLE transaksi MODIFY COLUMN status_transaksi VARCHAR(255) DEFAULT 'pending'");

        // Revert status updates
        DB::table('transaksi')->where('status_transaksi', 'dikemas')->update(['status_transaksi' => 'processing']);
        DB::table('transaksi')->where('status_transaksi', 'dikirim')->update(['status_transaksi' => 'shipped']);
        DB::table('transaksi')->where('status_transaksi', 'selesai')->update(['status_transaksi' => 'completed']);
        // For 'batal', we map it back to 'cancelled'. 'failed' original state is lost in this simplification.
        DB::table('transaksi')->where('status_transaksi', 'batal')->update(['status_transaksi' => 'cancelled']);

        // Change back to old enum definition
        DB::statement("ALTER TABLE transaksi MODIFY COLUMN status_transaksi ENUM('pending', 'processing', 'shipped', 'completed', 'cancelled', 'failed') DEFAULT 'pending'");
    }
};
