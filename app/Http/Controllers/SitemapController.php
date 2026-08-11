<?php

namespace App\Http\Controllers;

use Illuminate\Http\Response;
use Statamic\Facades\Entry;
use Statamic\Facades\Site;

class SitemapController extends Controller
{
    public function index(): Response
    {
        $content = view('sitemaps.index', [
            'sites' => Site::all(),
        ])->render();

        return response($content, 200)
            ->header('Content-Type', 'application/xml');
    }

    public function locale(string $locale): Response
    {
        $site = Site::get($locale);

        if (! $site) {
            abort(404);
        }

        $entries = Entry::query()
            ->where('collection', 'pages')
            ->where('site', $locale)
            ->whereStatus('published')
            ->get()
            // Collections without a route produce entries with no URL.
            ->filter(fn ($entry) => filled($entry->absoluteUrl()));

        $content = view('sitemaps.locale', [
            'entries' => $entries,
            'site' => $site,
        ])->render();

        return response($content, 200)
            ->header('Content-Type', 'application/xml');
    }
}
