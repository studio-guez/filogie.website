<?php echo '<?xml version="1.0" encoding="UTF-8"?>'; ?>

<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
@foreach($entries as $entry)
    <url>
        <loc>{{ $entry->absoluteUrl() }}</loc>
        <lastmod>{{ $entry->lastModified()->toW3cString() }}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>{{ $entry->collection()->handle() === 'pages' ? '1.0' : '0.8' }}</priority>
    </url>
@endforeach
</urlset>
