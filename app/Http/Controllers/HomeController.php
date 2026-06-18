<?php

namespace App\Http\Controllers;

use App\Services\EnableyApiService;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class HomeController extends Controller
{
    public function __construct(
        private EnableyApiService $enabley,
    ) {}

    public function __invoke(): Response
    {
        $error = null;
        $enableyTree = null;
        $enableyGroupTypes = [];

        try {
            $enableyTree = $this->enabley->getGroupTreeWithUsers();
        } catch (Throwable $e) {
            $error = $e->getMessage();
        }

        try {
            $enableyGroupTypes = $this->enabley->getGroupHierarchy();
        } catch (Throwable $e) {
            $enableyGroupTypes = [];
        }

        return Inertia::render('Home', [
            'enableyTree' => $enableyTree,
            'enableyError' => $error,
            'enableyGroupTypes' => $enableyGroupTypes,
        ]);
    }
}
