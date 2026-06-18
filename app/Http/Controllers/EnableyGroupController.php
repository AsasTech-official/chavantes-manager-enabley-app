<?php

namespace App\Http\Controllers;

use App\Services\EnableyApiService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Throwable;

class EnableyGroupController extends Controller
{
    public function __construct(
        private EnableyApiService $enabley,
    ) {}

    public function store(Request $request): RedirectResponse
    {
        try {
            $hierarchy = $this->enabley->getGroupHierarchy();
        } catch (Throwable $e) {
            return redirect()->route('home')->with('error', $e->getMessage());
        }

        if ($hierarchy === []) {
            return redirect()->route('home')->with('error', 'A API Enabley não devolveu tipos de hierarquia de grupos (GroupData.type).');
        }

        $allowed = array_values(array_unique(array_map(
            fn ($t) => mb_strtoupper(trim((string) $t), 'UTF-8'),
            $hierarchy
        )));

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'max:128'],
            'parent_identifier' => ['nullable', 'string'],
        ]);

        $type = mb_strtoupper(trim($data['type']), 'UTF-8');
        if (! in_array($type, $allowed, true)) {
            throw ValidationException::withMessages([
                'type' => 'O tipo escolhido não consta na hierarquia devolvida pela API Enabley.',
            ]);
        }

        $parentIdentifier = isset($data['parent_identifier']) && $data['parent_identifier'] !== ''
            ? $data['parent_identifier']
            : null;

        $name = mb_strtoupper(trim($data['name']), 'UTF-8');

        try {
            $this->enabley->createGroup(
                name: $name,
                type: $type,
                parentIdentifier: $parentIdentifier,
            );
        } catch (Throwable $e) {
            return redirect()->route('home')->with('error', $e->getMessage());
        }

        return redirect()->route('home')->with('success', 'Grupo criado.');
    }

    public function update(Request $request): RedirectResponse
    {
        try {
            $hierarchy = $this->enabley->getGroupHierarchy();
        } catch (Throwable $e) {
            return redirect()->route('home')->with('error', $e->getMessage());
        }

        if ($hierarchy === []) {
            return redirect()->route('home')->with('error', 'A API Enabley não devolveu tipos de hierarquia de grupos (GroupData.type).');
        }

        $allowed = array_values(array_unique(array_map(
            fn ($t) => mb_strtoupper(trim((string) $t), 'UTF-8'),
            $hierarchy
        )));

        $data = $request->validate([
            'identifier' => ['required', 'string', 'max:512'],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'max:128'],
            'parent_identifier' => ['nullable', 'string', 'max:512'],
        ]);

        $type = mb_strtoupper(trim($data['type']), 'UTF-8');
        if (! in_array($type, $allowed, true)) {
            throw ValidationException::withMessages([
                'type' => 'O tipo escolhido não consta na hierarquia devolvida pela API Enabley.',
            ]);
        }

        $parentIdentifier = isset($data['parent_identifier']) && $data['parent_identifier'] !== ''
            ? $data['parent_identifier']
            : null;

        $name = mb_strtoupper(trim($data['name']), 'UTF-8');

        try {
            $this->enabley->updateGroup(
                identifier: $data['identifier'],
                name: $name,
                type: $type,
                parentIdentifier: $parentIdentifier,
            );
        } catch (Throwable $e) {
            return redirect()->route('home')->with('error', $e->getMessage());
        }

        return redirect()->route('home')->with('success', 'Grupo atualizado.');
    }

    public function destroy(string $identifier): RedirectResponse
    {
        $identifier = rawurldecode($identifier);

        try {
            $this->enabley->deleteGroup($identifier);
        } catch (Throwable $e) {
            return redirect()->route('home')->with('error', $e->getMessage());
        }

        return redirect()->route('home')->with('success', 'Grupo apagado.');
    }
}
