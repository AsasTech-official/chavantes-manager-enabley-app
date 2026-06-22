<?php

namespace App\Http\Controllers;

use App\Services\EnableyApiService;
use App\Services\EnableyScopeService;
use App\Support\EnableyScopeContext;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class HomeController extends Controller
{
    public function __construct(
        private EnableyApiService $enabley,
        private EnableyScopeService $scopeService,
    ) {}

    public function __invoke(): Response
    {
        $error = null;
        $enableyTree = null;
        $enableyGroupTypes = [];
        $scope = EnableyScopeContext::current();

        try {
            $treePayload = $this->enabley->getGroupTreeWithUsers();
            $enableyTree = $this->scopeService->filterTreePayload($treePayload, $scope);
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
