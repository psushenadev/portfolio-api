import { XMLParser } from "fast-xml-parser";

export default async function handler(req, res) {
    try {
        const response = await fetch(
            "https://www.goodreads.com/review/list_rss/201900410?shelf=to-read",
            {
                headers: {
                    "User-Agent": "Mozilla/5.0"
                }
            }
        );

        if (!response.ok) {
            throw new Error("Failed to fetch Goodreads RSS.");
        }

        const xml = await response.text();

        const parser = new XMLParser({
            ignoreAttributes: false
        });

        const parsed = parser.parse(xml);

        const items = parsed?.rss?.channel?.item ?? [];

        const books = items.map((book) => ({
            title: book.title,
            author: book.author_name,
            image:
                book.book_large_image_url ||
                book.book_medium_image_url ||
                book.book_small_image_url,
            link: book.link,
            description: book.description
        }));

        res.setHeader(
            "Cache-Control",
            "public, s-maxage=3600, stale-while-revalidate=86400"
        );

        res.status(200).json(books);

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }
}