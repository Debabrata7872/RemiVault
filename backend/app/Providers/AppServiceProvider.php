<?php

namespace App\Providers;

use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Enforce 100% HTTPS scheme on production or when APP_FORCE_HTTPS is active
        if ($this->app->environment('production') || config('app.force_https', false) || env('APP_FORCE_HTTPS', false)) {
            URL::forceScheme('https');
        }
    }
}
