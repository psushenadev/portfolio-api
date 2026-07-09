import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
    ignoreAttributes: false,
});

export default async function handler(req, res) {

    // Allow requests from anywhere
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

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
            throw new Error("Failed to fetch Goodreads");
        }

        const xml = await response.text();

        const parsed = parser.parse(xml);

        const items = parsed?.rss?.channel?.item ?? [];

        const books = items.map((book) => ({

            id:
                book.book_id ??
                book.guid ??
                crypto.randomUUID(),

            title: book.title,

            author: book.author_name,

            cover:
                book.book_large_image_url ||
                book.book_medium_image_url ||
                book.book_small_image_url ||
                "",

            link: book.link,

            description: book.description ?? "",

            isbn: book.isbn ?? "",

            pages:
                Number(book.num_pages) || null,

            rating:
                Number(book.average_rating) || null,

            published:
                book.publication_year || null

        }));

        res.setHeader(
            "Cache-Control",
            "public, s-maxage=3600, stale-while-revalidate=86400"
        );

        return res.status(200).json({
            updated: new Date().toISOString(),
            count: books.length,
            books
        });

    }

    catch (err) {

        console.error(err);

        return res.status(500).json({
            error: "Unable to fetch Goodreads."
        });

    }

}