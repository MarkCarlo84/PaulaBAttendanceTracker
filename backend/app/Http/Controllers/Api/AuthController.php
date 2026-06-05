<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);
        $teacher = Teacher::where('email', $request->email)->first();
        if (!$teacher || !Hash::check($request->password, $teacher->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }
        $teacher->tokens()->delete();
        $token = $teacher->createToken('auth-token')->plainTextToken;
        return response()->json([
            'token' => $token,
            'teacher' => ['name' => $teacher->name, 'email' => $teacher->email],
        ]);
    }
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }
    public function user(Request $request)
    {
        return response()->json($request->user());
    }
    public function updateProfile(Request $request)
    {
        $teacher = $request->user();
        $rules = [];
        if ($request->has('name')) {
            $rules['name'] = 'string|max:255';
        }
        if ($request->has('email')) {
            $rules['email'] = 'email|unique:teachers,email,' . $teacher->id;
        }
        if ($request->has('new_password') || $request->has('current_password')) {
            $rules['current_password'] = 'required';
            $rules['new_password'] = 'required|string|min:6|confirmed';
        }
        $validated = $request->validate($rules);
        if (isset($validated['current_password'])) {
            if (!Hash::check($validated['current_password'], $teacher->password)) {
                return response()->json(['message' => 'Current password is incorrect'], 422);
            }
            $teacher->password = Hash::make($validated['new_password']);
        }
        if (isset($validated['name'])) $teacher->name = $validated['name'];
        if (isset($validated['email'])) $teacher->email = $validated['email'];
        $teacher->save();
        return response()->json(['message' => 'Profile updated successfully', 'teacher' => $teacher]);
    }
}
