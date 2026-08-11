<?php

use App\Http\Controllers\SitemapController;
use Illuminate\Support\Facades\Route;

Route::get('/sitemap.xml', [SitemapController::class, 'index'])
    ->name('sitemap.index');

Route::get('/sitemap-{locale}.xml', [SitemapController::class, 'locale'])
    ->name('sitemap.locale');

// Route::statamic('example', 'example-view', [
//    'title' => 'Example'
// ]);
