<?php echo '<?xml version="1.0" encoding="UTF-8"?>'; ?>

<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
@foreach($sites as $site)
    <sitemap>
        <loc>{{ url('/sitemap-' . $site->handle() . '.xml') }}</loc>
        <lastmod>{{ now()->toW3cString() }}</lastmod>
    </sitemap>
@endforeach
</sitemapindex>
