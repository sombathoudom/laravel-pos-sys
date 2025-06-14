
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
        Schema::create('sale_transactions', function (Blueprint $table) {
            $table->id('transaction_id');
            $table->foreignId('customer_id')->constrained('customers', 'id')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users', 'id')->onDelete('cascade');
            $table->foreignId('discount_id')->nullable()->constrained('discounts', 'discount_id')->onDelete('set null');

            $table->string('invoice_number')->unique();
            $table->enum('currency', ['USD', 'KHR']);
            $table->decimal('total_amount_usd', 8, 2);
            $table->decimal('total_amount_khr', 10, 0);
            $table->decimal('total_discount', 8, 2)->default(0);
            $table->decimal('delivery_fee', 8, 2)->default(0);
            $table->dateTime('transaction_date');
            $table->enum('status', ['paid', 'unpaid', 'partial_paid', 'cancelled'])->default('unpaid');
            $table->timestamps();
        });
        Schema::table('sale_transactions', function (Blueprint $table) {
            $table->index('transaction_date', 'idx_transactions_date');
            $table->index('user_id', 'idx_transactions_user');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sale_transactions');
    }
};
