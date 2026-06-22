<?php

namespace App\Http\Controllers;

use App\Services\EnableyApiService;
use App\Services\EnableyScopeService;
use App\Support\EnableyScopeContext;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class UsersController extends Controller
{
    public function __construct(
        private EnableyApiService $enabley,
        private EnableyScopeService $scopeService,
    ) {}

    public function __invoke(): Response
    {
        $error = null;
        $users = [];
        $groups = [];
        $groupsError = null;
        $scope = EnableyScopeContext::current();

        try {
            $users = $this->scopeService->filterUsers(
                $this->enabley->listUsersSimplified(),
                $scope,
            );
        } catch (Throwable $e) {
            $error = $e->getMessage();
        }

        try {
            $groups = $this->scopeService->filterFlatGroups(
                $this->enabley->listFlatGroupsWithParents(),
                $scope,
            );
        } catch (Throwable $e) {
            $groupsError = $e->getMessage();
        }

        return Inertia::render('Users', [
            'enableyUsers' => $users,
            'enableyError' => $error,
            'enableyGroups' => $groups,
            'enableyGroupsError' => $groupsError,
        ]);
    }
}
