#!/usr/bin/env node

const puppeteer = require('puppeteer');
const { load } = require('cheerio');

const baseUrl = 'https://www.drom.ru';
const mask = 'pdd/bilet_';
const selectors = [
    'div.pdd-ticket.b-media-cont',
    'div.b-flex.bm-forceFlex > div.b-flex__item.b-title.b-title_type_h3 > a.b-link',
    'div.b-media-cont.b-media-cont_reviews > div.b-title.b-title_type_h4.b-title_no-margin',
]

async function parseContent(contentPage) {
    const $ = await load(contentPage);
    const ticket = {
        title: $('h1').text().trim(),
        questions: []
    }
    for await (let item of $(selectors[0])) {
        const number = $(item).find(selectors[1]).text().trim();
        const text = $(item).find(selectors[2]).text().trim();
        ticket.questions.push(`${number} ${text}`);
    }

    return ticket;
}

async function main() {
    const browser = await puppeteer.launch({
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
        ],
        ignoreHTTPSErrors: true,
    });
    for (let i = 1; i <= 40; i++) {
        const page = await browser.newPage();
        try {
            const url = `${baseUrl}/${mask + i}`;
            await page.goto(url, {
                timeout: 120000,
                waitUntil: 'networkidle0',
            });

            const contentPage = await page.content();
            const ticket = await parseContent(contentPage);

            const result = [
                `### ${ticket.title}  \n`,
                `${ticket.questions.join('  \n')}  \n`,
                `[Ссылка на билет](${url})  \n`,
            ]

            console.log(result.join(''));

        } finally {
            await page.close();
        }
    }

    await browser.close();
}

main().catch(e => console.error(`[Error] ${e.message}`));