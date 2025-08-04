<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('keranjang', function (Blueprint $table) {
            $table->id('id_keranjang');
            $table->foreignId('user_id')
                  ->constrained('users', 'user_id')
                  ->cascadeOnDelete();
            $table->foreignId('produk_id')
                  ->constrained('produk', 'produk_id')
                  ->cascadeOnDelete();
            $table->integer('jumlah')->default(1);
            $table->decimal('harga_satuan', 10, 2);
            $table->decimal('subtotal', 10, 2);
            $table->timestamps();

            $table->unique(['user_id', 'produk_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('keranjang');
    }
};
