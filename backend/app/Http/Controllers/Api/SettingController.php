<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
class SettingController extends Controller
{
    public function index()
    {
        return response()->json(Setting::pluck('value', 'key'));
    }
    public function save(Request $request)
    {
        foreach ($request->all() as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }
        return response()->json(Setting::pluck('value', 'key'));
    }
}
