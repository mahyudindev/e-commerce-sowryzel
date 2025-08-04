<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Settings\ProfileController as SettingsProfileController;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Response;

/**
 * Proxy class that forwards requests to the Settings\ProfileController
 * This resolves the namespace issue without changing the routes.
 */
class ProfileController extends Controller
{
    /**
     * The instance of the actual profile controller.
     */
    protected SettingsProfileController $controller;

    /**
     * Create a new controller instance.
     */
    public function __construct()
    {
        $this->controller = new SettingsProfileController();
    }

    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        return $this->controller->edit($request);
    }

    /**
     * Update the user's profile settings.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        return $this->controller->update($request);
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        return $this->controller->destroy($request);
    }
}
