<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RajaOngkirController extends Controller
{
    protected $apiKey;
    protected $baseUrl;
    protected $originCityId;

    public function __construct()
    {
        $this->apiKey = config('rajaongkir.api_key');
        $this->baseUrl = config('rajaongkir.base_url');
        $this->originCityId = config('rajaongkir.origin_city_id');

        if (!$this->apiKey || !$this->baseUrl) {
            Log::error('RajaOngkir API Key or Base URL is not configured.');
        }
    }

    /**
     * Mengambil daftar semua provinsi.
     */
    public function getProvinces(Request $request)
    {
        if (!$this->apiKey || !$this->baseUrl) {
            return response()->json(['error' => 'RajaOngkir service is not configured.'], 500);
        }

        try {
            $response = Http::withHeaders([
                'key' => $this->apiKey
            ])->get("{$this->baseUrl}/province");

            if ($response->successful()) {
                $provinces = $response->json()['rajaongkir']['results'];
                return response()->json(['data' => $provinces]);
            }

            Log::error('RajaOngkir API Error (getProvinces): ' . $response->body());
            return response()->json(['error' => 'Failed to fetch provinces from RajaOngkir.', 'details' => $response->json()], $response->status());

        } catch (\Exception $e) {
            Log::error('Exception in getProvinces: ' . $e->getMessage());
            return response()->json(['error' => 'An unexpected error occurred while fetching provinces.'], 500);
        }
    }

    /**
     * Mengambil daftar kota berdasarkan ID provinsi.
     */
    public function getCities(Request $request)
    {
        if (!$this->apiKey || !$this->baseUrl) {
            return response()->json(['error' => 'RajaOngkir service is not configured.'], 500);
        }

        $request->validate([
            'province_id' => 'required|integer',
        ]);

        try {
            $response = Http::withHeaders([
                'key' => $this->apiKey
            ])->get("{$this->baseUrl}/city", [
                'province' => $request->province_id
            ]);

            if ($response->successful()) {
                $cities = $response->json()['rajaongkir']['results'];
                return response()->json(['data' => $cities]);
            }

            Log::error('RajaOngkir API Error (getCities): ' . $response->body());
            return response()->json(['error' => 'Failed to fetch cities from RajaOngkir.', 'details' => $response->json()], $response->status());

        } catch (\Exception $e) {
            Log::error('Exception in getCities: ' . $e->getMessage());
            return response()->json(['error' => 'An unexpected error occurred while fetching cities.'], 500);
        }
    }

    public function calculateShippingCost(Request $request)
    {
        if (!$this->apiKey || !$this->baseUrl || !$this->originCityId) {
            return response()->json(['error' => 'RajaOngkir service or origin city is not configured.'], 500);
        }

        $request->validate([
            'destination_city_id' => 'required|integer',
            'weight'              => 'required|integer|min:1',
            'courier'             => 'required|string|in:jne,pos,tiki',
        ]);

        try {
            $response = Http::withHeaders([
                'key' => $this->apiKey
            ])->post("{$this->baseUrl}/cost", [
                'origin'        => $this->originCityId,
                'destination'   => $request->destination_city_id,
                'weight'        => $request->weight,
                'courier'       => strtolower($request->courier),
            ]);

            if ($response->successful()) {
                $costs = $response->json()['rajaongkir']['results'];
                if (empty($costs) || empty($costs[0]['costs'])) {
                     return response()->json(['data' => [], 'message' => 'No shipping options found for the selected courier and destination.']);
                }
                return response()->json(['data' => $costs[0]['costs']]);
            }

            Log::error('RajaOngkir API Error (calculateShippingCost): ' . $response->body());
            return response()->json(['error' => 'Failed to calculate shipping cost from RajaOngkir.', 'details' => $response->json()], $response->status());

        } catch (\Exception $e) {
            Log::error('Exception in calculateShippingCost: ' . $e->getMessage());
            return response()->json(['error' => 'An unexpected error occurred while calculating shipping cost.'], 500);
        }
    }
}
