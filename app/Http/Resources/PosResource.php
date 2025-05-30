<?php

namespace App\Http\Resources;

use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PosResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $products = [];
        $productImage = asset('storage/' . $this->images->first()?->path) ?? null;

        // Add the main product if it has quantity
        if ($this->quantity > 0) {
            $products[] = [
                'key' => Str::uuid(),
                'id' => $this->product_id,
                'name' => $this->product_name,
                'code' => $this->product_code,
                'price' => $this->sell_price_usd,
                'category_id' => $this->category_id,
                'image' => $productImage,
                'type' => 'single',
                'size' => $this->size,
                'color' => $this->color,
                'current_stock' => $this->quantity,
            ];
        }

        // Add variants as separate products
        foreach ($this->variants as $variant) {
            if ($variant->quantity > 0) {
                $products[] = [
                    'key' => Str::uuid(),
                    'id' => $this->product_id . '-' . $variant->variant_id,
                    'variant_id' => $variant->variant_id,
                    'name' => $this->product_name . ' [' . $variant->variant_code . ']',
                    'code' => $variant->variant_code,
                    'price' => $variant->sell_price_usd,
                    'image' => $variant->images->first()?->path ? asset('storage/' . $variant->images->first()?->path) : $productImage,
                    'type' => 'variant',
                    'current_stock' => $variant->quantity,
                    'size' => $variant->size,
                    'color' => $variant->color,
                    'variant_name' => $this->product_name,
                ];
            }
        }

        return $products;
    }
}
