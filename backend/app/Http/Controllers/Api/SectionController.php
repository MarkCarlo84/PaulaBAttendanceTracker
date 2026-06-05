<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Section;
use Illuminate\Http\Request;
class SectionController extends Controller
{
    public function index()
    {
        return response()->json(Section::orderBy('name')->get());
    }
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:sections,name',
            'description' => 'nullable|string|max:500',
        ]);
        $section = Section::create($validated);
        return response()->json($section, 201);
    }
    public function update(Request $request, $id)
    {
        $section = Section::findOrFail($id);
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:sections,name,' . $id,
            'description' => 'nullable|string|max:500',
        ]);
        $section->update($validated);
        return response()->json($section);
    }
    public function destroy($id)
    {
        $section = Section::findOrFail($id);
        $section->delete();
        return response()->json(['message' => 'Section deleted']);
    }
}
