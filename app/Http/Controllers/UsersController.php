<?php

namespace App\Http\Controllers;

use App\Services\EnableyApiService;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class UsersController extends Controller
{
    public function __construct(
        private EnableyApiService $enabley,
    ) {}

    public function __invoke(): Response
    {
        $error = null;
        $users = [];
        $groups = [];
        $groupsError = null;

        try {
            $users = $this->enabley->listUsersSimplified();
        } catch (Throwable $e) {
            $error = $e->getMessage();
        }

        try {
            $groups = $this->enabley->listFlatGroups();
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
